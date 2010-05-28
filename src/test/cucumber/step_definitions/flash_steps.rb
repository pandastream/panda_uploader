require File.expand_path(File.join(File.dirname(__FILE__), "..", "support", "flash_selenium"))

Then /^the Flash object should appear on the page$/ do
  page.should have_css('#SWFUpload_0')
end

When /^(?:|I )press the file selection button$/ do
  pending
end
