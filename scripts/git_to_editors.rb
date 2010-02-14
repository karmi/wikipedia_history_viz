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
  json = JSON.pretty_generate(@editors)
  filename = @filename.downcase.split('.').first.to_s + '_editors.json'
  File.open( Pathname(File.dirname(__FILE__)).join(filename), 'w' ) { |f| f << "var editors = #{json}" }
  puts "\nData saved into file #{filename}"
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
@filename = File.basename( Dir[File.join(repo, '*.txt')].entries.first )

unless @filename
  puts "\e[1m[!] No .txt file found in #{repo}\e[0m"
  exit 1
end

puts "Getting commit log for '#{Pathname(repo).join(@filename)}'"

git_log = `(cd #{repo} && git shortlog --numbered --summary)`
total_revisions = `(cd #{repo} && git log --oneline | wc -l)`.strip.to_f

unless $?.success?
  puts "\e[31m[!] Error while retrieving Git log\e[0m"
  exit 1
end

commits = git_log.split("\n")

@editors = []

commits.each_with_index do |commit, index|
  impact, author = commit.scan(/\s*(\d+)\t(.+)/).first
  puts "#{author} (#{impact} commmits)"
  @editors << { :author => author, :impact => impact.to_i, :percent => (impact.to_f/total_revisions)*100 }
end

finish
