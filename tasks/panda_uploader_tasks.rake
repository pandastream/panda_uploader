# desc "Explaining what the task does"
# task :panda_uploader do
#   # Task goes here
# end
VERSION = '0.0.1'

namespace :panda_uploader do
  namespace :scripts do
    desc 'Install the Panda uploader scripts into the public/javascripts directory of this application'
    task :install do
      require 'fileutils'
      public_dest = RAILS_ROOT + '/public'
      js_dest = public_dest + '/javascripts/panda_uploader'
      images_dest =  public_dest + '/images'
      
      if File.exists?(js_dest)
        puts "Directory #{js_dest} already exists!"
      else
        puts "Creating directory #{js_dest}"
        FileUtils.mkdir js_dest
      end
      puts "** Installing Panda uploader scripts to #{js_dest}"
      copy_all_files File.expand_path(File.dirname(__FILE__) + '/../public/javascripts/'), js_dest
      
      puts ""
      puts "** Installing Panda uploader SWF to #{public_dest}"
      FileUtils.cp File.expand_path(File.dirname(__FILE__) + '/../public/swfupload.swf'), public_dest + "/swfupload.swf"
      
      puts ""
      puts "** Installing Panda uploader images to #{images_dest}"
      copy_all_files File.expand_path(File.dirname(__FILE__) + '/../public/images/'), images_dest
      
      puts ""
      puts "** Successfully installed Panda uploader version #{VERSION}"
    end    
  end
end

def copy_all_files(source, dest)
  Dir.chdir(source)
  Dir.foreach(source) do |entry|
    next if entry =~ /^\./
    next if File.directory?(File.join(source, entry))
    puts "-> Installing file #{entry}... to #{dest}"
    FileUtils.cp File.join(source, entry), File.join(dest, entry) #, :noop => true#, :verbose => true
  end
end