As a developer
I want to have a basic functioning form
So that I can upload videos to Panda

Scenario: Upload a video
  Given I am on the "/basic" page
  Then the Flash object should appear on the page
  When I select a video file
  And I press "Save"
  And pause for 5 seconds
