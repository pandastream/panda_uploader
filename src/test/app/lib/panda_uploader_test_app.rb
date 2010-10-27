require 'yaml'
require 'json'
require 'sinatra/base'
require 'panda'
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
    encodings = @panda.get("/videos/#{@video_id}/encodings.json")
    @num_encodings = encodings.size
    @pretty_printed_encodings = pretty_dump(encodings)
    @pretty_printed_additional_args = params.size > 1 ? pretty_dump(params.reject{|k, v| k == 'panda_video_id' }) : ''
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
    def panda_uploader_link_tag(version = 'cat')
      dirpath = File.join(APP_ROOT, *%w{public panda_uploader})
      filename = Dir.entries(dirpath).find{|entry| entry =~ %r{jquery.panda-uploader-([\.\d]|beta)+.#{version}.js} }
      %{<script src="/panda_uploader/#{filename}"></script>}
    end
    
    def pretty_dump(o)
      ret = ''
      PP.pp(o, ret)
      ret
    end
  end

  get '/with_other_libraries' do
    erb :with_other_libraries
  end

  get '/with_cancel_button' do
    erb :with_cancel_button
  end

end
