TEST_DIR = File.dirname(File.dirname(File.dirname(__FILE__)))
APP_DIR = File.join(TEST_DIR, 'app')
app_file = File.join(APP_DIR, 'app')

require app_file
# Force the application name because polyglot breaks the auto-detection logic.
Sinatra::Application.app_file = app_file

require 'spec/expectations'
require 'capybara/cucumber'
require 'capybara/session'

Capybara.default_selector = :css
Capybara.default_driver = :selenium
Capybara.app = PandaUploaderTestApp

# require File.join(File.dirname(__FILE__), 'flash_selenium_driver')
# Capybara::Driver::FlashSelenium.flash_object_id = 'SWFUpload_0'