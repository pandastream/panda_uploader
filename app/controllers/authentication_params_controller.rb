class AuthenticationParamsController < ApplicationController
  def index
    auth_params = Panda.authentication_params(
      params[:method], 
      params[:request_uri],
      params[:request_params].blank? ? {} : params[:request_params]
    )
    render :json => auth_params
  end
end
