# PandaUploader
require "panda"

module PandaUploader
  module ClassMethods
  end
  
  def self.included(base)
    base.extend(ClassMethods)
    base.helper PandaUploaderHelper
  end

end