require 'sinatra/base'
require 'panda'
require 'json'
require 'pp'

class PandaUploaderTestApp < Sinatra::Base

  set :root, APP_ROOT
  set :static, true

  before do
    config_path = File.join(APP_ROOT, *%w{config panda.yml})
    config = YAML::load(File.open(config_path))
    @panda ||= Panda::Connection.new(config['panda'])
  end

  get '/' do
    erb :index
  end
  
  get '/player' do
    @video_id = params[:panda_video_id]
    encodings = JSON.parse(@panda.get("/videos/#{@video_id}/encodings.json"))
    @num_encodings = encodings.size
    @pretty_printed_encodings = ''
    PP.pp(encodings, @pretty_printed_encodings)
    erb :player
  end

  get '/basic' do
    erb :basic
  end

end
