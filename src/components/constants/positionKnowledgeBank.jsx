
export const PHYSICAL_ASSESSMENTS = {
  Speed: {
    description: 'Sprint speed and acceleration over short distances',
    testName: '20m Sprint'
  },
  Power: {
    description: 'Explosive strength and vertical jump ability',
    testName: 'Vertical Jump'
  },
  Endurance: {
    description: 'Aerobic capacity and stamina',
    testName: 'YIRT'
  },
  Agility: {
    description: 'Change of direction speed and coordination',
    testName: 'Shuttle Run'
  }
};

export const POSITION_KNOWLEDGE = {
  'GK': {
    title: 'Goalkeeper',
    description: 'Command the box, organize the defense, and initiate the build-up',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Shot Stopping - Long, central, angled, close',
          'Controlling the Box - Crosses, long passes, 1v1 situations',
          'Distribution - Range of passing (short and long)',
          'Accurate throwing distribution (long and short)',
          'Positioning and anticipation',
          'Safe hands on flighted service',
          'Controlled shot stopping'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Organization - Directing and organizing team shape',
          'Reading Pressure - Anticipate threats and through balls',
          'Managing Space - Protect space behind back line',
          'Helping Defensive Organization',
          'Initiate build up and possession forward',
          'Good positional sense relating to opposition attacks',
          'Knows when to play out vs. safety'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Strength & Power - Explosive and agile',
          'Mobility and agility (can get up and down)',
          'Explosive pace over short distances',
          'Good jumping ability and timing',
          'Strong upper body to deal with contact',
          'Balance and coordination'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Composed under pressure',
          'Brave and courageous',
          'Communication - Clear and commanding',
          'Maintains focus and concentration',
          'Confident presence',
          'Recovers from setback quickly',
          'Ability to multitask (observe and organize)'
        ]
      }
    },
    trainingFocus: [
      'Shot stopping from various angles and distances',
      'Distribution technique - both feet and throws',
      'Positioning and angle play',
      'Communication and organizing the defense',
      '1v1 situations and breakaways',
      'Dealing with crosses and set pieces'
    ]
  },

  'Right Centerback': {
    title: 'Right Center Back',
    description: 'Anchor the defense, win duels, and initiate the build-up',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          '1v1 defending - Tackle, intercept, heading',
          'Heading ability - Defensive and offensive',
          'Range of Passing - Initiate build',
          'Safe and range passing',
          'First touch (possession/interception)',
          'Ball winner - Tackling, heading, intercepting, & clearances'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Organization - Verbal Communication to direct team shape',
          'Management of Space and Threats',
          'Line Management - drop, step, hold',
          'Body Shape & positioning - side on/ ball side-goal side',
          'Reading Pressure and opponent shape',
          'Understanding of passing options',
          'Protect the space behind and in front of line'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Strength & Power, Speed & Agility',
          'Strength for 1v1 duels',
          'Size and presence',
          'Good jumping ability and timing',
          'Powerful in challenges'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Calm, Decisive, Relentless',
          'Communication - Directing & Organizing',
          'Brave and courageous',
          'Leadership and Consistency',
          'Maintains focus and concentration',
          'Ability to multitask (play and organize)'
        ]
      }
    },
    trainingFocus: [
      '1v1 defending - Body position and timing',
      'Aerial dominance - Attacking and defending',
      'Passing range and accuracy under pressure',
      'Reading the game and anticipation',
      'Communication and organizing the defensive line',
      'Recovery runs and positioning'
    ]
  },

  'Left Centerback': {
    title: 'Left Center Back',
    description: 'Anchor the defense, win duels, and initiate the build-up',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          '1v1 defending - Tackle, intercept, heading',
          'Heading ability - Defensive and offensive',
          'Range of Passing - Initiate build',
          'Safe and range passing',
          'First touch (possession/interception)',
          'Ball winner - Tackling, heading, intercepting, & clearances'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Organization - Verbal Communication to direct team shape',
          'Management of Space and Threats',
          'Line Management - drop, step, hold',
          'Body Shape & positioning - side on/ ball side-goal side',
          'Reading Pressure and opponent shape',
          'Understanding of passing options',
          'Protect the space behind and in front of line'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Strength & Power, Speed & Agility',
          'Strength for 1v1 duels',
          'Size and presence',
          'Good jumping ability and timing',
          'Powerful in challenges'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Calm, Decisive, Relentless',
          'Communication - Directing & Organizing',
          'Brave and courageous',
          'Leadership and Consistency',
          'Maintains focus and concentration',
          'Ability to multitask (play and organize)'
        ]
      }
    },
    trainingFocus: [
      '1v1 defending - Body position and timing',
      'Aerial dominance - Attacking and defending',
      'Passing range and accuracy under pressure',
      'Reading the game and anticipation',
      'Communication and organizing the defensive line',
      'Recovery runs and positioning'
    ]
  },

  'Right Outside Back': {
    title: 'Right Outside Back',
    description: 'Defend the flank, support attacks, and create overloads',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Positive first touch',
          'Strong crossing - Various deliveries',
          'Ability running with the ball',
          'Quality angled passing',
          'Dominate in 1v1 Situations (tackling, intercepting, taking on)',
          'Combination Play'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Reading and Positioning',
          'Delay-Deny-Dictate approach',
          'Screen Middle and Press Wide',
          'Partnership with CB and Winger',
          'Provide width and attacking support',
          'Create overloads in wide areas',
          'Anticipating and Preventing Threats'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Fast & Agile, Quick, and Fit',
          'Great agility for 1v1 situations',
          'Pace to expose and recover space',
          'Good jumping ability and timing',
          'Endurance to handle extended sprints',
          'Mobility and strength for individual duels'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Energetic and Dynamic',
          'Maintains focus and concentration',
          'Brave and courageous',
          'Controlled personality',
          'Resilient and team first'
        ]
      }
    },
    trainingFocus: [
      '1v1 defending - Jockeying and tackling',
      'Overlapping runs and timing',
      'Crossing technique - Variety of deliveries',
      'Recovery defending and transition',
      'Combination play with wingers',
      'Defensive positioning and awareness'
    ]
  },

  'Left Outside Back': {
    title: 'Left Outside Back',
    description: 'Defend the flank, support attacks, and create overloads',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Positive first touch',
          'Strong crossing - Various deliveries',
          'Ability running with the ball',
          'Quality angled passing',
          'Dominate in 1v1 Situations (tackling, intercepting, taking on)',
          'Combination Play'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Reading and Positioning',
          'Delay-Deny-Dictate approach',
          'Screen Middle and Press Wide',
          'Partnership with CB and Winger',
          'Provide width and attacking support',
          'Create overloads in wide areas',
          'Anticipating and Preventing Threats'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Fast & Agile, Quick, and Fit',
          'Great agility for 1v1 situations',
          'Pace to expose and recover space',
          'Good jumping ability and timing',
          'Endurance to handle extended sprints',
          'Mobility and strength for individual duels'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Energetic and Dynamic',
          'Maintains focus and concentration',
          'Brave and courageous',
          'Controlled personality',
          'Resilient and team first'
        ]
      }
    },
    trainingFocus: [
      '1v1 defending - Jockeying and tackling',
      'Overlapping runs and timing',
      'Crossing technique - Variety of deliveries',
      'Recovery defending and transition',
      'Combination play with wingers',
      'Defensive positioning and awareness'
    ]
  },

  'Defensive Midfielder': {
    title: 'Defensive Midfielder',
    description: 'Shield the backline, win duels, and distribute the ball',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          '1v1 defending (set and transition)',
          '360° range of passing',
          'First touch (possession/interception)',
          'Tight receiving skills',
          'Heading - Win aerial battles',
          'Ability to Break Pressure - Dribble & passing',
          'Tackling and intercepting'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Organizing Team Defensive Shape',
          'Spatial Awareness (360º) - Constant scanning',
          'Shielding of backline',
          'Support play (receiving angles)',
          'Building and Initiating Pressure',
          'Awareness of opponents/situation (end transition)',
          'Providing offensive & defensive balance',
          'Space creation'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Strong, quick, fit',
          'Agility and quickness',
          'Endurance for box-to-box play',
          'Strength and Mobility for 1v1 duel',
          'Powerful in challenges'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Controlled, insightful, and disciplined',
          'Leader on the field',
          'Leadership and Concentration',
          'Bravery on the ball',
          'Ability to multitask (play and organize)',
          'Communication and directing',
          'Consistency in performance'
        ]
      }
    },
    trainingFocus: [
      'Intercepting passes and reading the game',
      'Range of passing - Short and long distribution',
      'Positioning to shield the backline',
      'Tackling technique and timing',
      'Transition play - Defensive to attacking',
      'Scanning and 360° awareness'
    ]
  },

  'Center Midfielder': {
    title: 'Center Midfielder',
    description: 'Link defense and attack, control tempo, create chances',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Quality with both feet',
          'Forward passing - Breaking lines',
          'Shooting from distance',
          'Tight receiving skills',
          'Tackling and ball winning',
          'Range of passing'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Defensive support (cut passing lanes)',
          'Support play (receiving angles)',
          'Tracking runners',
          'Creating space and vertical movement (late runs)',
          'Connection between lines',
          'Transition piece - Quick decision making'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Endurance (long distance)',
          'Speed endurance',
          'Strength for physical battles',
          'Agility and quickness'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Concentration (reaction to turnovers)',
          'Brave in possession',
          'Reliability (two ways)',
          'Consistency',
          'Game intelligence'
        ]
      }
    },
    trainingFocus: [
      'Passing range and accuracy',
      'Receiving under pressure',
      'Shooting technique from distance',
      'Defensive positioning and tracking',
      'Transition play - Both directions',
      'Creating and using space'
    ]
  },

  'Attacking Midfielder': {
    title: 'Attacking Midfielder',
    description: 'Create chances, break lines, and orchestrate the attack',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Quality with both feet',
          'Forward passing - Incisive and creative',
          'Shooting - Various techniques',
          'Tight & Disguised receiving skills',
          'Dribbling in tight spaces',
          'Set piece specialist',
          'Combination play'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Spatial Awareness - Body position to break lines',
          'Connection to forward 3',
          'Creative passing and through balls',
          'Transition piece - Quick to attack',
          'Creation and use of space',
          'Make play predictable defensively',
          'Dictating and Shaping Play'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Fast & agile, quick, and fit',
          'Sharp movements',
          'Speed endurance',
          'Balance (ride challenges)',
          'Explosive acceleration'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Creative and Dangerous',
          'Confidence on the ball',
          'Brave - Risk Taker',
          'Extrovert personality',
          'Quick Minded - Fast decision making'
        ]
      }
    },
    trainingFocus: [
      'Receiving in tight spaces',
      'Through balls and creative passing',
      'Shooting technique and finishing',
      'Movement to find pockets of space',
      '1v2 situations and dribbling',
      'Transition moments - Creating chances quickly'
    ]
  },

  'Right Winger': {
    title: 'Right Winger',
    description: 'Beat defenders 1v1, create chances, and finish opportunities',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Combination play',
          'Turning and protecting the ball',
          'Finishing off the dribble',
          'Receiving skills (in front/in behind)',
          'Dribbling - Taking on defenders',
          'Crossing - Various techniques',
          '1v1 attacking skills'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Movement and interchange to break lines',
          'Unlocking the final 1/3',
          'Transition piece - Quick to attack',
          'Understanding of space (in front/in behind)',
          'Support and communication with outside back',
          'Creating wide overloads',
          'Shaping and Dictating Play when defending'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Quick, explosive, and agile',
          'Pace to beat defenders',
          'Speed endurance',
          'Balance (ride challenges)',
          'Agility for 1v1 situations'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Creative and Energetic',
          'Confidence to take on defenders',
          'Bravery in duels',
          'Patience to wait for the right moment',
          'Resilient after failed attempts'
        ]
      }
    },
    trainingFocus: [
      '1v1 attacking - Beating defenders',
      'Crossing technique - Various situations',
      'Finishing from wide positions',
      'Movement off the ball',
      'Combination play with fullback',
      'Defensive tracking and pressing'
    ]
  },

  'Left Winger': {
    title: 'Left Winger',
    description: 'Beat defenders 1v1, create chances, and finish opportunities',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Combination play',
          'Turning and protecting the ball',
          'Finishing off the dribble',
          'Receiving skills (in front/in behind)',
          'Dribbling - Taking on defenders',
          'Crossing - Various techniques',
          '1v1 attacking skills'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Movement and interchange to break lines',
          'Unlocking the final 1/3',
          'Transition piece - Quick to attack',
          'Understanding of space (in front/in behind)',
          'Support and communication with outside back',
          'Creating wide overloads',
          'Shaping and Dictating Play when defending'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Quick, explosive, and agile',
          'Pace to beat defenders',
          'Speed endurance',
          'Balance (ride challenges)',
          'Agility for 1v1 situations'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Creative and Energetic',
          'Confidence to take on defenders',
          'Bravery in duels',
          'Patience to wait for the right moment',
          'Resilient after failed attempts'
        ]
      }
    },
    trainingFocus: [
      '1v1 attacking - Beating defenders',
      'Crossing technique - Various situations',
      'Finishing from wide positions',
      'Movement off the ball',
      'Combination play with fullback',
      'Defensive tracking and pressing'
    ]
  },

  'Forward': {
    title: 'Center Forward',
    description: 'Score goals, hold up play, and lead the press',
    categories: {
      technical: {
        title: 'Technical Skills',
        icon: '⚽',
        color: 'from-emerald-600 to-green-600',
        points: [
          'Goal Scoring - Various techniques',
          'Turning with the ball',
          'Heading - Attacking and holding up',
          'Receiving skills (back to goal/ in behind)',
          'Dribbling in tight spaces',
          'Hold up play',
          'Finishing with both feet'
        ]
      },
      tactical: {
        title: 'Tactical Awareness',
        icon: '🧠',
        color: 'from-blue-600 to-emerald-600',
        points: [
          'Creating Chances & Scoring Goals',
          'Space creation In & Out of Box',
          'Transition piece - Target for counters',
          'Understanding of space (in front/in behind)',
          'Making play predictable defensively',
          'Shaping and Dictating Play when pressing',
          'Threatening - Movement and combination play'
        ]
      },
      physical: {
        title: 'Physical Attributes',
        icon: '💪',
        color: 'from-red-600 to-orange-600',
        points: [
          'Strong, explosive, quick',
          'Pace to run in behind',
          'Speed endurance',
          'Powerful in duels',
          'Strong runner',
          'Aerial presence'
        ]
      },
      mental: {
        title: 'Mental Qualities',
        icon: '🎯',
        color: 'from-purple-600 to-pink-600',
        points: [
          'Dynamic and Dangerous',
          'Confidence in front of goal',
          'Bravery in physical battles',
          'Patience to wait for chances',
          'Resilient after missed opportunities',
          'Killer instinct'
        ]
      }
    },
    trainingFocus: [
      'Finishing - Various angles and techniques',
      'Hold up play and shielding',
      'Movement in the box',
      'Heading technique',
      'Running in behind defenses',
      'Pressing and leading the defensive effort'
    ]
  }
};
