#
#Flash Selenium - Ruby Client
#
#Date: 30 March 2008
#Paulo Caroli, Sachin Sudheendra
#http://code.google.com/p/flash-selenium
#-----------------------------------------
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.
#

class FlashSelenium
  
  def initialize(selenium, flashObjectId)
    @selenium = selenium
    @flashObjectId= flashObjectId
  end
  
  def start()
    @selenium.start
  end
  
  def stop()
    @selenium.stop
  end
  
  def open(url)
    @selenium.open url
  end
  
  def call(functionName, *parameters)
    return @selenium.get_eval(jsForFunction(functionName, *parameters))
  end
  
  def wait_for_page_to_load(timeout)
    @selenium.wait_for_page_to_load(timeout)
  end
  
  #### Standard Methods ####
  
  def percent_loaded()
    return call("PercentLoaded")
  end
  
  def is_playing()
    return call("IsPlaying")
  end
  
  def get_variable(varName)
    return call("GetVariable", varName)
  end
  
  def goto_frame(value)
    return call("GotoFrame", value)
  end
  
  def load_movie(layerNumber, url)
    return call("LoadMovie", layerNumber, url)
  end
  
  def pan(x, y, mode)
    return call("Pan", x, y, mode)
  end
  
  def play()
    return call("Play")
  end
  
  def rewind()
    return call("Rewind")
  end
  
  def set_variable(name, value)
    return call("SetVariable", name, value)
  end
  
  def set_zoom_rect(left, top, right, bottom)
    return call("SetZoomRect", left, top, right, bottom)
  end
  
  def stop_play()
    return call("StopPlay")
  end
  
  def total_frames()
    return call("TotalFrames")
  end
  
  def zoom(percent)
    return call("Zoom", percent)
  end
  
  #### TellTarget Methods ####
  
  def t_call_frame(target, frameNumber)
    return call("TCallFrame", target, frameNumber)
  end
  
  def t_call_label(target, label)
    return call("TCallLabel", target, label)
  end
  
  def t_current_frame(target)
    return call("TCurrentFrame", target)
  end
  
  def t_current_label(target)
    return call("TCurrentLabel", target)
  end
  
  def t_get_property(target, property)
    return call("TGetProperty", target, property)
  end
  
  def t_get_property_as_number(target, property)
    return call("TGetPropertyAsNumber", target, property)
  end
  
  def t_goto_frame(target, frameNumber)
    return call("TGotoFrame", target, frameNumber)
  end
  
  def t_goto_label(target, label)
    return call("TGotoLabel", target, label)
    
  end
  def t_play(target)
    return call("TPlay", target)
  end
  
  def t_set_property(property, value)
    return call("TSetProperty", property, value)
  end
  
  def t_stop_play(target)
    return call("TStopPlay", target)
  end
  
  #### Standard Events ####
  
  def on_progress(percent)
    return call("OnProgress", percent)
  end
  
  def on_ready_state_change(state)
    return call("OnReadyStateChange", state)
  end
  
  #### Custom Methods ####
  
  def checkBrowserAndReturnJSPrefix()
    indexOfMicrosoft = @selenium.get_eval("navigator.appName.indexOf(\"Microsoft Internet\")")
    if (indexOfMicrosoft != -1)
      return createJSPrefix_window_document(@flashObjectId)
    else
      return createJSPrefix_document(@flashObjectId)
    end
  end
  
  def createJSPrefix_window_document(flashObjectId)
    return "window.document[\'" + flashObjectId + "\'].";
  end
  
  def createJSPrefix_document(flashObjectId)
    return "document[\'" + flashObjectId + "\'].";
  end
  
  def jsForFunction(functionName, *args)
    @flashJSStringPrefix = checkBrowserAndReturnJSPrefix()
    functionArgs = ""
    if args.empty?
      return @flashJSStringPrefix + functionName + "();"
    end
    args.each do | arg |
      functionArgs = functionArgs + "'" + arg.to_s + "',"
    end
    functionArgs = functionArgs[0..(functionArgs.length - 2)]
    return @flashJSStringPrefix + functionName + "(" + functionArgs + ");"
  end
  
end