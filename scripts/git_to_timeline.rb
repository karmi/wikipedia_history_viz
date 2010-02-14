#!/usr/bin/env ruby

require 'rubygems'
require 'fileutils'
require 'time'
require 'pathname'
require 'json'

class String
  def blank?
    self !~ /\S/
  end
end

def finish
  json = JSON.pretty_generate(@months)
  filename = @filename.downcase.split('.').first.to_s + '_timeline.json'
  File.open( Pathname(File.dirname(__FILE__)).join(filename), 'w' ) { |f| f << "var data = #{json}" }
  puts "\n#{@count} revisions saved in file #{filename} (#{@months.size} months of history)"
  exit 0
end

trap "SIGINT", lambda { finish }

# Path to repo
repo = ARGV.shift
unless repo
  puts "\e[1m[!] Please pass a path to a Git repository\e[0m"
  exit 1
end

# Get Wikipedia article filename
# TODO: Make more generic, like "content.txt" or so
@filename = File.basename( Dir[File.join(repo, '*.txt')].entries.first )

unless @filename
  puts "\e[1m[!] No .txt file found in #{repo}\e[0m"
  exit 1
end

puts "Getting commit log for '#{Pathname(repo).join(@filename)}'"

# Get Git log for repo
git_log = `(cd #{repo} && \
            git log --reverse \
                    --pretty=tformat:'~~~COMMIT~~~%n%ai==][==%H==][==%h==][==%d==][==%an==][==%s==][==~~~END~~~' \
                    --numstat \
                    --no-color \
                    --ignore-all-space)`

unless $?.success?
  puts "\e[31m[!] Error while retrieving Git log\e[0m"
  exit 1
end

# Split the commit by special marker
commits = git_log.split("~~~COMMIT~~~\n").map { |line| line unless line.blank? }.compact

# puts commits.inspect

@months = []

current_month = { :date => '',
                  :count => 0,
                  :revisions => [] }

puts "Parsing commit log"

@count = 0

commits.each_with_index do |commit, index|
  # puts commit[/^\d{4}.+$/].inspect
  # puts commit[/^\d+\t\d+\t.+$/].inspect
  # puts commit[/^diff --git.*/m].inspect
  # puts commit.inspect
  commit_info = commit[/\d{4}\-\d{2}\-\d{2}.+~~~END~~~\n/]
  # puts commit_info.inspect; exit
  # Split the commit parts by marker
  date, id, short_id, refs, author, subject = commit_info.split('==][==')
  current_month[:date] = commit[0...7] if date == commits.first.split('==][==').first
  # Populate revision info
  revision = { :id => id,
               :short_id => short_id,
               :date     => Time.parse(date).strftime('%d/%m/%Y %H:%M'),
               :author   => author,
               :subject  => subject }
  revision[:tag] = refs.match(/tag: (\d+)/)[1] rescue nil
  # Extract numstat info
  # NOTE: We do allow empty commits,  cf. Wikipedia rev 2670396
  numstat = commit[/^(\d+\t\d+)\t.+$/, 1] || ''
  # puts numstat

  added_deleted = numstat.split("\t").map{|l| l.to_i}
  unless added_deleted.empty?
    revision[:added], revision[:deleted] = added_deleted
  else
    revision[:added], revision[:deleted] = [0, 0]
  end
  revision[:impact] = revision[:added] - revision[:deleted]
  # puts id, date, revision[:impact]

  revision[:bot] = author =~ /[bB]ot/ ? true : false

  # revision[:diff] = commit[/\n\ndiff --git.*@@.*?\n(.*)\n*/m, 1].strip rescue nil
  # puts revision.inspect; exit
  if date[0...7] == current_month[:date][0...7]
    current_month[:count] += 1
    current_month[:revisions] << revision
  else
    @months << current_month if current_month[:count] > 0
    current_month = { :date => date[0...7], :count => 0, :revisions => [revision] }
  end
  @months << current_month if commit == commits.last
  @count += 1
  print (@count % 250 == 0) ? " #{@count} " : '.'
  STDOUT.flush
end

# Write to file and print final result
finish
