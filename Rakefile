require 'rubygems'
require 'bundler/setup'
require 'yaml'

$:.push(File.expand_path('../lib', __FILE__))

environment = (ENV["ENVIRONMENT"] || 'development').to_sym
CONFIG = YAML.load_file('./config/config.yml')[environment]
VERSION = ENV['VERSION'] || raise("provide a version number")

Rake.application.options.trace = true

desc 'Bundle and minify source files.'
task :build => ["build/panda-uploader.min.js"]

ALL_JS_FILES = FileList['src/**/*.js']
directory "./build"
directory "./dist"
directory "./dist/#{VERSION}"
directory "./dist/#{VERSION}/assets"
directory "vendor"

file "build/panda-uploader.min.js" => ["vendor/plovr.jar", *ALL_JS_FILES] do |file|
  sh('java -jar vendor/plovr.jar build config.min.js')
end

file "vendor/plovr.jar" => "vendor" do
  sh "curl http://plovr.googlecode.com/files/plovr-eba786b34df9.jar -o vendor/plovr.jar"
end

task :bundle => ["./dist/#{VERSION}", :build] do
  bundle_js ["licence.js", "build/panda-uploader.min.js"], :to => "./dist/#{VERSION}/panda-uploader.min.js"
  sh("mkdir -p ./dist/#{VERSION}/assets/")
  sh("cp src/assets/* ./dist/#{VERSION}/assets/")
end

task :serve do
  sh('java -jar vendor/plovr.jar serve config.min.js')
end

def bundle_js(files, options={})
  js=files.map {|f|
    File.read(f)
  }.join("\n")

  js.gsub!(/<VERSION>/, VERSION)
  js.gsub!(/<CDN_HOST>/, CONFIG[:js][:host])
  File.open(options[:to], "w") {|f| f.puts js }
end