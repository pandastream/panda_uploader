module FlashHelper
  def flash(flash_object_id = nil)
    driver = Capybara::Driver::Selenium.driver
    @flash = FlashSelenium.new(driver, flash_object_id) if flash_object_id
    @flash = FlashSelenium.new(driver, 'SWFUpload_0') unless @flash
    @flash
  end
end