Pod::Spec.new do |s|
  s.name           = 'PickleCoachPose'
  s.version        = '1.0.0'
  s.summary        = 'On-device pose extraction for PickleCoach'
  s.description    = 'Reads local practice video frames and extracts 2D body landmarks with Apple Vision.'
  s.author         = 'PickleCoach'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'CoreMedia', 'CoreVideo', 'ImageIO', 'Vision'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
