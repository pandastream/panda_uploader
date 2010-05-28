require 'capybara/driver/selenium_driver'

class Capybara::Driver::FlashSelenium < Capybara::Driver::Selenium
  def self.driver
    base_driver = super
    FlashSelenium.new(base_driver, flash_object_id)
  end
  
  def self.flash_object_id=(fo_id)
    @flash_object_id = fo_id
  end
  
  def self.flash_object_id
    @flash_object_id
  end
end
