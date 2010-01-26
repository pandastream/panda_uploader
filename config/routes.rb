ActionController::Routing::Routes.draw do |map|
  map.authentication_params '/authentication_params', :controller => 'authentication_params', :action => 'index'
end