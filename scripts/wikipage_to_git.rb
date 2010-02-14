#!/usr/bin/env ruby

# <em>Le mieux est l'ennemi du bien / Voltaire</em>
#
# = Wikipage to Git =
#
# This script takes an XML file with revision history for a Wikipedia page,
# parses available metadata/information and stores them in a Git repository
# for further analysis.
#
# Currently the script:
#
# * Extracts the metadata from Wikipedia revision info
# * Extracts content of revision
# * Saves the content as commit into Git
# * Makes tag in Git with revision ID for reference
#
# == Todos, Ideas ==
# * Take "minor" revisions into account
# * Allow passing Wikipedia page title, download it, and pass to the script
# * Allow incremental updating of the history, ie. download only new revisions
#

require 'rubygems'
require 'nokogiri'
require 'fileutils'
require 'time'
require 'pathname'

path = ARGV.shift
unless path
  puts "\e[1m[!] Please pass a path to an XML file\e[0m"
  puts "Use eg. `wget 'http://en.wikipedia.org/wiki/Special:Export/PAGE_TITLE?history'` to get the file"
  exit(1)
end

class String
  def blank?
    self !~ /\S/
  end
end

# File basename
basename = File.basename(path, '.*')

# Create Git repo
output_dir = Pathname("#{basename}__history")
`(git init #{output_dir})`
puts " Created repository in #{output_dir}\n"

# Load the doc
@doc = Nokogiri(File.read(path))
puts " Loaded file, #{@doc.css('revision').size} revisions"
puts ('-'*100) + "\n"

errors = []

started_at = Time.now

@doc.css('revision').each_with_index do |r, count|

  # Get revision info
  timestamp = r.xpath('xmlns:timestamp').text
  date      = Time.parse(timestamp)
  rev_id    = r.xpath('xmlns:id').text
  text      = r.xpath('xmlns:text').text
  comment   = r.xpath('xmlns:comment').text.blank? ? "~" : r.xpath('xmlns:comment').text # Git dislikes empty commit msgs

  # Get contributor info
  contributor     = r.xpath('xmlns:contributor')
  author_username = contributor.xpath('xmlns:username').text
  if author_username.blank?
    author_ip    = contributor.xpath('xmlns:ip').text
    author_email = "Anonymous <#{author_ip}@en.wikipedia.org>"
    author       = author_ip
    anonymous    = true
  else
    author_id    = contributor.xpath('xmlns:id').text
    author_email = "#{author_username} <#{author_id}@en.wikipedia.org>"
    author       = author_username
    anonymous    = false
  end

  puts "[#{count}] " + timestamp + ' : ' + author
  puts comment + "\n"

  # Set commit date from revision
  # ENV['GIT_AUTHOR_DATE'] = ENV['GIT_COMMITER_DATE'] = date.rfc2822

  # Write article content into file with "\ No newline at end of file" fixes
  text << "\n" if text !~ /^.*\n$/m
  File.open( output_dir.join(basename + '.txt'), 'w' ) { |f| f << text }

  # Prepare commit message
  message = comment.gsub(/"/, '\"')

  # Commit revision into Git
  # TODO : Clean up running Git commands
  output = `(cd #{output_dir} && \
            git add . && \
            export GIT_AUTHOR_DATE='#{date.rfc2822}' && \
            git commit --allow-empty \
                       --author="#{author_email}" \
                       --message="#{message}")`

  unless $?.success?
    errors << output
    puts "\e[31m[!] Error while commiting revision into Git: #{output}\e[0m"
    puts ('-'*100) + "\n"
    next
  end

  # Create Git tag
  output = `(cd #{output_dir} && \
            export GIT_AUTHOR_NAME='#{author}' && \
            export GIT_AUTHOR_EMAIL='#{author_email}' && \
            export GIT_AUTHOR_DATE='#{date.rfc2822}' && \
            git tag -a -m "#{rev_id}" #{rev_id})`

  unless $?.success?
    errors << output
    puts "\e[31m[!] Error while commiting tag into Git: #{output}\e[0m"
    puts ('-'*100) + "\n"
    next
  end

  puts ('-'*100) + "\n"

end

puts "\n" + ('='*100)
puts "File imported into Git with #{errors.size} errors in #{(Time.now-started_at).to_f/60.0} mins"
