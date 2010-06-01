Then /^the Flash object should appear on the page$/ do
  page.should have_css('#SWFUpload_0')
end

When /^I select a video file$/ do
  flash.call('Select_Handler', ['panda.mp4'])
end
