require 'sinatra/base'
require 'panda'
require 'json'

class PandaUploaderTestApp < Sinatra::Base

  set :root, APP_ROOT
  set :static, true

  before do
    @panda ||= Panda::Connection.new({
      :cloud_id => 'test-cloud-it',
      :access_key => 'test-access-key',
      :secret_key => 'test-secret-key',
    })
  end

  get '/' do
    erb :index
  end

  get '/basic' do
    erb :basic
  end

end
