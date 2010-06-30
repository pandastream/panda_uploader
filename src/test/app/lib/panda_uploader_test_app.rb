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
    @this_is_the_index = true
    erb :index
  end
  
  get('/favicon.ico'){ 404 }
  
  get '/player' do
    @video_id = params[:panda_video_id]
    encodings = JSON.parse(@panda.get("/videos/#{@video_id}/encodings.json"))
    @num_encodings = encodings.size
    @pretty_printed_encodings = ''
    PP.pp(encodings, @pretty_printed_encodings)
    erb :player
  end

  get '/signatures' do
    content_type :json
    @panda.signed_params("POST", "/videos.json").to_json
  end

  get '/:page' do |page|
    erb page.to_sym
  end

  helpers do
    def panda_uploader_link_tag
      dirpath = File.join(APP_ROOT, *%w{public panda_uploader})
      filename = Dir.entries(dirpath).find{|entry| entry =~ %r{jquery.panda-uploader-[\.\d]+.min.js} }
      %{<script src="/panda_uploader/#{filename}"></script>}
    end
  end

end
