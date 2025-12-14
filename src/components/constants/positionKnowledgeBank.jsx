export const PHYSICAL_ASSESSMENTS = {
  Speed: {
    description: 'Sprint speed measures a player\'s ability to accelerate quickly and maintain high velocity over short distances.',
    examples: ['20m sprint test - Acceleration from standing start to 20m mark, focus on first step explosion and stride frequency', 'Flying 10m sprint - Max velocity assessment with 20m run-up to measure top-end speed capability', '30m acceleration test - Extended sprint to assess sustained acceleration ability'],
    importance: 'Critical for beating defenders in 1v1 situations, recovering defensively to track runners, covering ground quickly in transition, pressing opponents effectively, and making recovery runs',
    training: ['Resisted sprints with bands/sleds to build explosive power', 'Plyometric drills including box jumps and bounds', 'Hill sprints for leg strength development', 'Speed endurance intervals (6x40m with 30s rest)', 'Technique work on arm drive and stride mechanics'],
    benchmarks: {
      elite: '< 2.9s',
      good: '2.9-3.2s',
      average: '3.2-3.5s',
      developing: '> 3.5s'
    }
  },
  Power: {
    description: 'Jumping power and explosive strength measure a player\'s ability to generate force quickly, crucial for aerial duels and dynamic movements.',
    examples: ['Vertical jump test - Measure max vertical displacement from standing position, indicates lower body explosive power', 'Standing long jump - Horizontal power assessment, tests total body coordination and force production', 'Counter movement jump - Jump with preparatory dip to measure stretch-shortening cycle efficiency'],
    importance: 'Essential for winning aerial duels in both attack and defense, powerful shooting and clearances, explosive first step in sprints, jumping to head crosses and corners, and physical dominance in challenges',
    training: ['Depth jumps from boxes progressing 12"-24" height', 'Olympic lift variations (clean, snatch) for full-body power', 'Single-leg plyometrics for balance and unilateral strength', 'Medicine ball throws and slams', 'Weighted jump squats building to 30-40% bodyweight'],
    benchmarks: {
      elite: '> 20 inches',
      good: '16-20 inches',
      average: '13-16 inches',
      developing: '< 13 inches'
    }
  },
  Endurance: {
    description: 'Cardiovascular endurance measures a player\'s ability to sustain high-intensity activity throughout a match, recover between efforts, and maintain technical quality when fatigued.',
    examples: ['YIRT (Yo-Yo Intermittent Recovery Test) - Progressive shuttle runs with short recovery, sport-specific endurance measure', 'Beep test (Multi-stage fitness test) - Incremental shuttle run until exhaustion', '12-minute Cooper run - Distance covered in 12 minutes for aerobic capacity', '30-15 Intermittent Fitness Test - Soccer-specific high-intensity intervals'],
    importance: 'Fundamental for maintaining performance throughout full 90 minutes plus stoppage, recovery between high-intensity actions, sustaining pressing intensity, competing in final minutes when matches are decided, and reducing injury risk from fatigue',
    training: ['High-intensity interval training (HIIT) - 8x2min at 90% with 1min recovery', 'Small-sided games 4v4/5v5 with small pitch dimensions', 'Fartlek running mixing speeds and intensities', 'Threshold runs at lactate threshold pace', 'Position-specific conditioning drills mimicking match demands'],
    benchmarks: {
      elite: '> Level 18',
      good: 'Level 14-18',
      average: 'Level 10-14',
      developing: '< Level 10'
    }
  },
  Agility: {
    description: 'Agility measures a player\'s ability to change direction quickly while maintaining control, balance, and body position - essential for both attacking and defending movements.',
    examples: ['Shuttle run (5-10-5 test) - Multi-directional speed with rapid deceleration and acceleration', 'T-test - Forward sprint, lateral shuffles, and backpedaling in T-pattern', '505 agility test - 180-degree turn assessment', 'Illinois agility test - Complex pattern with multiple direction changes', 'Reactive agility drills responding to visual/auditory cues'],
    importance: 'Key for dribbling in tight spaces and beating defenders, defending 1v1 situations and staying with attackers, quick transitions between attack and defense, evading pressure when receiving, and maintaining balance through physical contact',
    training: ['Ladder drills with varying patterns and progressions', 'Cone drill circuits with cuts at different angles', 'Change of direction exercises with deceleration emphasis', 'Reactive agility with partner/coach providing visual cues', 'Small-sided games on reduced space forcing quick turns'],
    benchmarks: {
      elite: '< 4.8s',
      good: '4.8-5.2s',
      average: '5.2-5.6s',
      developing: '> 5.6s'
    }
  },
  Strength: {
    description: 'Muscular strength and core stability enable players to hold position, win physical duels, maintain balance under pressure, and prevent injuries.',
    examples: ['Max squat/deadlift relative to bodyweight', 'Plank holds and variations', 'Single-leg strength assessments', 'Push-up and pull-up tests', 'Core rotation exercises'],
    importance: 'Vital for shielding the ball from defenders, winning physical battles and holding off challenges, injury prevention through muscular support, powerful striking and throwing, and maintaining technique under fatigue',
    training: ['Compound lifts (squat, deadlift, bench, row) 3-5 sets of 3-6 reps', 'Core stability work - planks, dead bugs, pallof presses', 'Single-leg exercises for balance and stability', 'Functional movements mimicking soccer actions', 'Resistance band work for injury prevention'],
    benchmarks: 'Bodyweight squat minimum, progressing to 1.5x bodyweight for advanced players'
  },
  Flexibility: {
    description: 'Range of motion and flexibility allow for optimal movement patterns, reduce injury risk, and enable technical execution.',
    examples: ['Sit and reach test', 'Hip flexor mobility assessment', 'Ankle dorsiflexion range', 'Shoulder mobility tests', 'Dynamic movement screening'],
    importance: 'Reduces muscle strain and injury risk, enables full range of motion for technical skills, improves kicking power and accuracy, allows for dynamic movements and quick changes of direction',
    training: ['Dynamic warm-up routine before every session', 'Static stretching post-training when muscles are warm', 'Yoga or mobility-specific sessions weekly', 'Foam rolling and self-myofascial release', 'PNF stretching with partner'],
    benchmarks: 'Position-specific ranges with emphasis on hip, ankle, and shoulder mobility'
  }
};

export const POSITION_KNOWLEDGE = {
  'GK': {
    name: 'Goalkeeper',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Initiate build up and possession forward',
          'Help break initial lines',
          'Play around, through, beyond',
          'Adjust body position to receive and play quickly',
          'Providing support & clearances',
          'Connected to back line',
          'Help organize Countermeasures-Balance'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Help to organize and keep ball in attacking half',
          'Move and support behind the ball',
          'Help to organize Countermeasures-Balance',
          'Plus 1 Defensively'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Initiate Counter Attack',
          'Break out and find highest option',
          'Throw or kick',
          'Initiate Build-up',
          'Maintain possession – allow team to regain shape',
          'Push up defensive line- keep team connected'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Helping Defensive Organization',
          'Recognizing Threats- Space or Players',
          'Organizing Team Shape to dictate play',
          'Management of Space',
          'Protect the Space behind our back line- drop, step, hold',
          'Space between lines-connected and compact- vertical and horizontal',
          'Read Pressure',
          'Adjusting Starting Position',
          'Anticipate and intercept through balls or passes',
          'Continuously adjusting position'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Controlling the Box',
          'Defending Crosses, long passes and 1v1 Situations',
          'Intercept, catch, punch, deflect',
          'Organization of MIB',
          'Protecting the Goal: Prevent Scoring',
          'Making Saves-long, central, angled, close',
          'Reacting immediately to recover for second phase if rebound'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Direct teammates and anticipate threats',
          'Counter Measures',
          'Protect most dangerous Space',
          'Identify Threats & Marks',
          'Adjust positioning and body shape',
          'Protect the Goal and Defend Space'
        ]
      }
    }
  },
  'Right Centerback': {
    name: 'Centerback',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Initiate Build-up and Possession Forward',
          'Reading pressure',
          'Position in relation to GK, Defensive line, HM-Provide Depth',
          'Receiving and passing under pressure',
          'First Touch',
          'Body shape',
          'Help Break Initial Lines- pass or dribble',
          'Play around, through, or over',
          'Provide Support and Balance',
          'Change the Point',
          'Help Organize Countermeasures'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Support Behind the ball',
          'Maintain possession, change the point, lock in',
          'Keep Lines Connected- vertically and horizontally',
          'Finishing the Attack',
          'Through ball, service, shot from distance'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Initiate Counter Attack',
          'Connect 1st Pass',
          'Highest Option',
          'Initiate Build-up',
          'Secure possession- allow team to gain shape',
          'Move into a supporting position',
          'Protect Against Counter Attack'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Organization-Verbal Communication',
          'Team Shape to Dictate Play',
          'Recognize opponent shape and reading pressure',
          'Management of Space and Threats',
          'Compact and connected between lines- vertical and horizontal',
          'Line Management- drop, step, hold',
          'Player Responsibility- track runners & provide cover',
          'Protect the space behind and in front of line',
          'Body Shape & positioning- side on/ ball side-goal side',
          'Deny and disrupt Forward Passes'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1- Ball Winner',
          'Challenge, intercept, tackle',
          'Prevent Goal Scoring Opportunities',
          'MIB and defending service & through balls',
          'Contain vs. Touch Tight',
          'Dominating 1v1 Ball Winner',
          'Challenge, intercept, tackle, block shots',
          'Clearances & Managing 2nd Phase'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Providing Organization',
          'Directing Teammates and anticipating threats',
          'Press or Regroup to Press',
          'Delay, Deny, Dictate',
          'Line Management: Drop-step-hold',
          'Read pressure',
          'Deal with most dangerous threat-space or player',
          'Positioning- side on/ ball side-goal side'
        ]
      }
    }
  },
  'Left Centerback': {
    name: 'Centerback',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Initiate Build-up and Possession Forward',
          'Reading pressure',
          'Position in relation to GK, Defensive line, HM-Provide Depth',
          'Receiving and passing under pressure',
          'First Touch',
          'Body shape',
          'Help Break Initial Lines- pass or dribble',
          'Play around, through, or over',
          'Provide Support and Balance',
          'Change the Point',
          'Help Organize Countermeasures'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Support Behind the ball',
          'Maintain possession, change the point, lock in',
          'Keep Lines Connected- vertically and horizontally',
          'Finishing the Attack',
          'Through ball, service, shot from distance'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Initiate Counter Attack',
          'Connect 1st Pass',
          'Highest Option',
          'Initiate Build-up',
          'Secure possession- allow team to gain shape',
          'Move into a supporting position',
          'Protect Against Counter Attack'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Organization-Verbal Communication',
          'Team Shape to Dictate Play',
          'Recognize opponent shape and reading pressure',
          'Management of Space and Threats',
          'Compact and connected between lines- vertical and horizontal',
          'Line Management- drop, step, hold',
          'Player Responsibility- track runners & provide cover',
          'Protect the space behind and in front of line',
          'Body Shape & positioning- side on/ ball side-goal side',
          'Deny and disrupt Forward Passes'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1- Ball Winner',
          'Challenge, intercept, tackle',
          'Prevent Goal Scoring Opportunities',
          'MIB and defending service & through balls',
          'Contain vs. Touch Tight',
          'Dominating 1v1 Ball Winner',
          'Challenge, intercept, tackle, block shots',
          'Clearances & Managing 2nd Phase'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Providing Organization',
          'Directing Teammates and anticipating threats',
          'Press or Regroup to Press',
          'Delay, Deny, Dictate',
          'Line Management: Drop-step-hold',
          'Read pressure',
          'Deal with most dangerous threat-space or player',
          'Positioning- side on/ ball side-goal side'
        ]
      }
    }
  },
  'Right Outside Back': {
    name: 'Outside Back',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Supporting Build-up',
          'Reading opponent\'s pressure',
          'Positioning in relation to Defensive line, Midfield Line, and Wide Forward',
          'Provide Width',
          'Create Overloads- Wide and Central',
          'Help Break Initial Lines & Final Lines and Advance Forward- pass or dribble',
          'Play around, through, or over',
          'Provide Support and Balance',
          'Change the Point',
          'Receiving and Passing under Pressure',
          'Body shape',
          'First Touch',
          'Help Organize Countermeasures'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Advance Forward',
          'Create overload and numbers up in final third',
          'Flank Play',
          'Dominate 1v1',
          'Take on',
          'Finishing the Attack- Score or Assist',
          'Crosses- Quality of Service & decision on ball',
          'Next Best, Wide Space, Early',
          'RIB'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Starting and Supporting Counter Attack',
          'Provide Width',
          'Connect 1st Pass',
          'Initiate Build',
          'Possess to Gain Attacking Shape',
          'Prevent Counter Attack'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Reading and Positioning',
          'Communication- Help to Organize',
          'Delay-Deny-Dictate',
          'Screen Middle and Press Wide',
          'Partnership with Wide Forward and Center Back',
          'Press vs. Regroup to Repress',
          'Anticipating and Preventing Threats',
          'Protect Space Behind the Line',
          'Line Management- drop, step, hold',
          'Body Shape: side on/ ball side-goal side',
          'Player Responsibility- track runners & provide cover'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1',
          'intercept, tackle, wall pass defending, aerial battles',
          'Flank Defending',
          'Regain in Pressure Pocket',
          'Deny and Defend Crosses',
          'Dominate 1v1',
          'Challenge, intercept, tackle, block',
          'Prevent Goal Scoring Opportunities',
          'MIB, Track Runners, & Aerial Battles',
          'Contain vs. Touch Tight',
          'Body Position- See Ball and Player',
          'Clearances & Managing 2nd Phase'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Provide Organization & Anticipate Threats',
          'Delay- Deny-Dictate',
          'Press vs. Regroup to Press',
          'Deal with most dangerous threat-space or player',
          'Positioning- side on'
        ]
      }
    }
  },
  'Left Outside Back': {
    name: 'Outside Back',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Supporting Build-up',
          'Reading opponent\'s pressure',
          'Positioning in relation to Defensive line, Midfield Line, and Wide Forward',
          'Provide Width',
          'Create Overloads- Wide and Central',
          'Help Break Initial Lines & Final Lines and Advance Forward- pass or dribble',
          'Play around, through, or over',
          'Provide Support and Balance',
          'Change the Point',
          'Receiving and Passing under Pressure',
          'Body shape',
          'First Touch',
          'Help Organize Countermeasures'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Advance Forward',
          'Create overload and numbers up in final third',
          'Flank Play',
          'Dominate 1v1',
          'Take on',
          'Finishing the Attack- Score or Assist',
          'Crosses- Quality of Service & decision on ball',
          'Next Best, Wide Space, Early',
          'RIB'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Starting and Supporting Counter Attack',
          'Provide Width',
          'Connect 1st Pass',
          'Initiate Build',
          'Possess to Gain Attacking Shape',
          'Prevent Counter Attack'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Reading and Positioning',
          'Communication- Help to Organize',
          'Delay-Deny-Dictate',
          'Screen Middle and Press Wide',
          'Partnership with Wide Forward and Center Back',
          'Press vs. Regroup to Repress',
          'Anticipating and Preventing Threats',
          'Protect Space Behind the Line',
          'Line Management- drop, step, hold',
          'Body Shape: side on/ ball side-goal side',
          'Player Responsibility- track runners & provide cover'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1',
          'intercept, tackle, wall pass defending, aerial battles',
          'Flank Defending',
          'Regain in Pressure Pocket',
          'Deny and Defend Crosses',
          'Dominate 1v1',
          'Challenge, intercept, tackle, block',
          'Prevent Goal Scoring Opportunities',
          'MIB, Track Runners, & Aerial Battles',
          'Contain vs. Touch Tight',
          'Body Position- See Ball and Player',
          'Clearances & Managing 2nd Phase'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Provide Organization & Anticipate Threats',
          'Delay- Deny-Dictate',
          'Press vs. Regroup to Press',
          'Deal with most dangerous threat-space or player',
          'Positioning- side on'
        ]
      }
    }
  },
  'Defensive Midfielder': {
    name: 'Defensive Midfielder',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Support and Initiating Build-up',
          'Reading the opponent\'s pressure',
          'Creating overloads- central and wide',
          'Help Break Initial & Final Lines and Advance Forward- pass or dribble',
          'Play around, through, or over',
          'Link Between lines',
          'Provide Support and Balance',
          'Change the Point',
          'Maintain Possession',
          'Dictating the pace of the Game: Accelerating play or slowing it down',
          'Receiving and Passing under Pressure',
          'Body shape',
          'First Touch',
          'Help Organize Countermeasures'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Support to Break Final Line',
          'Balance- change the point and lock play in',
          'Keeping lines connected- vertical and horizontal',
          'Create chances to score',
          'Through balls and Service from Deep',
          'Combination Play',
          'RIB and framing the box',
          'Shots from Distance'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Initiate Counter Attack',
          'Connect 1st Pass- Highest Option',
          'Initiate Build',
          'Securing possession',
          'Support – win on one side and connect on other',
          'Prevent Counter Attack'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Organizing Team Defensive Shape',
          'Verbal Communication',
          'Maintaining Connection and Compactness between lines-vertical and horizontal',
          'Screening Middle and Press Forward & Wide',
          'Supporting and Providing Cover to Forward Line',
          'Building and Initiating Pressure',
          'Regroup to Repress',
          'Opportunity to Regain',
          'Anticipating and Preventing Threats',
          'Deny Forward Passes and Penetrations',
          'Protect the space in front of backs and screen entry passes',
          'Player Responsibility- track runners & provide cover',
          'Defend Vertical Middle'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1',
          'Challenge, intercept, tackle, aerial battles',
          'Prevent Scoring & Deny Danger Zone Entry',
          'Protect and Screen Space in front of backs',
          'MIB',
          'Tracking Runners- Contain vs. Touch Tight',
          'Dominating 1v1 Ball Winner',
          'Challenge, intercept, tackle, block shots',
          'Clearances & Managing 2nd Phase'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Provide Organization and Anticipate Threats',
          'Press vs. Regroup to Repress',
          'Delay-Deny-Dictate',
          'Keep Play in front',
          'Position- Side On/ ball side-goal side'
        ]
      }
    }
  },
  'Attacking Midfielder': {
    name: 'Attacking Midfielder',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Supporting Build-up',
          'Reading opponent\'s pressure',
          'Positioning between lines- special awareness',
          'Creating Overloads- central and wide',
          'Help Break Initial Lines and Advance Forward- pass or dribble',
          'Play around, through, or over',
          'Help Break Final Line',
          'Movement and interchange',
          'Unbalance Opponent- Speed of Play and Change the Point',
          'Combination Play',
          'Dribble',
          'Receiving and Passing under Pressure',
          'Body shape',
          'First Touch'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Creating Chances & Scoring Goals',
          'Assists- through balls, crosses',
          'Shots- type, technique, decision',
          'RIB',
          'Adjusting Positioning to provide balance and support',
          'Maintain Possession and lock it in'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Starting and Supporting Counter Attack',
          'Positioning to be an outlet',
          'Connect 1st Pass',
          'Initiating Build Up',
          'Securing possession and regain shape'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Dictating and Shaping Play',
          'Make Play Predictable',
          'Delay-Deny-Dictate',
          'Compacted and Connected-Vertical and Horizontal',
          'Screen Middle, Press forward and wide',
          'Communication and support to forward line',
          'Building and Initiating Pressure',
          'Press vs. Regroup to Repress',
          'Opportunity to Regain',
          'Deny forward passes and penetrations',
          'Player responsibility',
          'Protecting most dangerous space- See one, screen one',
          'Defend Vertical Middle'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1 Situations',
          'Challenge, intercept, tackle, aerial battles',
          'Prevent Scoring & Deny Danger Zone Entry',
          'Protect and Screen Space in front of backs',
          'Stay connected-Recover',
          'Tracking Runners',
          'Contain vs. Touch Tight',
          'Dominating 1v1 Ball Winner',
          'Challenge, tackle, block shots, double back',
          'Clearances & Managing 2nd Phase'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Prevent Counter Attack',
          'Press vs. Regroup to Repress',
          'Take away Time, Space, Options',
          'Anticipate Threat- Space or Player',
          'Communication to Organize'
        ]
      }
    }
  },
  'Right Winger': {
    name: 'Winger',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Supporting the build up',
          'Create Height and Width',
          'Discipline in positioning- timing',
          'Reading opponent\'s pressure',
          'Movement and Interchange',
          'Between & Behind Lines',
          'Threatening',
          'Timing',
          'Receiving Under Pressure',
          'Spatial and positional Awareness',
          'Facing Up, Combination Play',
          'Possession to Advance Forward and Break Final Line',
          'Dribble or Pass',
          'Combination Play',
          'Change of Tempo'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Dominating 1v1',
          'Take-on',
          'Create',
          'Creating Chances and Scoring goals',
          'Crossing',
          'Early, Wide, Next Best',
          'Quality & Accuracy of Service',
          'Re-creating Width',
          'Finishing and Scoring',
          'Shots- type, technique, decision',
          'Assists- through balls, crosses',
          'RIB'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Creating & supporting Counter Attack',
          'Movement to threaten and advance forward',
          'High or wide',
          'Support to secure possession'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Shaping and Dictating Play',
          'Screen Middle, Press Forward and Wide',
          'Positioning',
          'Recognizing opponent\'s build up',
          'Ability to receive and execute information from deeper players',
          'Building and Initiating Pressure',
          'Press vs. Re-group to Press',
          'Opportunity to Regain',
          'Opportunity to Double',
          'Deny forward pass and penetrations',
          'Take away time, space, options',
          'Player Responsibility'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1 Situations',
          'Challenge, intercept, tackle, Wall pass defending',
          'Flank Defending',
          'Prevent and Disrupt',
          'Regain in Pressure Pocket',
          'Prevent Goal Scoring Opportunities',
          'Deny and Defend Crosses',
          'Dominate 1v1',
          'MIB & Tracking Runners',
          'Opportunities to Double',
          'Managing 2nd Phase',
          'Positioning to Repress',
          'Challenge, intercept, Tackle'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Prevent Counter Attack',
          'Immediate Pressure',
          'Take away Time, Space, Options',
          'Press vs. Regroup to Repress',
          'Anticipate and Dealing with Threats- space or player'
        ]
      }
    }
  },
  'Left Winger': {
    name: 'Winger',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Supporting the build up',
          'Create Height and Width',
          'Discipline in positioning- timing',
          'Reading opponent\'s pressure',
          'Movement and Interchange',
          'Between & Behind Lines',
          'Threatening',
          'Timing',
          'Receiving Under Pressure',
          'Spatial and positional Awareness',
          'Facing Up, Combination Play',
          'Possession to Advance Forward and Break Final Line',
          'Dribble or Pass',
          'Combination Play',
          'Change of Tempo'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Dominating 1v1',
          'Take-on',
          'Create',
          'Creating Chances and Scoring goals',
          'Crossing',
          'Early, Wide, Next Best',
          'Quality & Accuracy of Service',
          'Re-creating Width',
          'Finishing and Scoring',
          'Shots- type, technique, decision',
          'Assists- through balls, crosses',
          'RIB'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Creating & supporting Counter Attack',
          'Movement to threaten and advance forward',
          'High or wide',
          'Support to secure possession'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Shaping and Dictating Play',
          'Screen Middle, Press Forward and Wide',
          'Positioning',
          'Recognizing opponent\'s build up',
          'Ability to receive and execute information from deeper players',
          'Building and Initiating Pressure',
          'Press vs. Re-group to Press',
          'Opportunity to Regain',
          'Opportunity to Double',
          'Deny forward pass and penetrations',
          'Take away time, space, options',
          'Player Responsibility'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1 Situations',
          'Challenge, intercept, tackle, Wall pass defending',
          'Flank Defending',
          'Prevent and Disrupt',
          'Regain in Pressure Pocket',
          'Prevent Goal Scoring Opportunities',
          'Deny and Defend Crosses',
          'Dominate 1v1',
          'MIB & Tracking Runners',
          'Opportunities to Double',
          'Managing 2nd Phase',
          'Positioning to Repress',
          'Challenge, intercept, Tackle'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Prevent Counter Attack',
          'Immediate Pressure',
          'Take away Time, Space, Options',
          'Press vs. Regroup to Repress',
          'Anticipate and Dealing with Threats- space or player'
        ]
      }
    }
  },
  'Center Midfielder': {
    name: 'Center Midfielder',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Support and Initiating Build-up',
          'Reading the opponent\'s pressure',
          'Creating overloads- central and wide',
          'Link Between lines',
          'Provide Support and Balance',
          'Change the Point',
          'Maintain Possession',
          'Dictating the pace of the Game',
          'Receiving and Passing under Pressure'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Support to Break Final Line',
          'Balance- change the point and lock play in',
          'Keeping lines connected',
          'Create chances to score',
          'Through balls and Service',
          'Combination Play',
          'Shots from Distance'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Initiate Counter Attack',
          'Connect 1st Pass- Highest Option',
          'Initiate Build',
          'Securing possession',
          'Support – win on one side and connect on other'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Organizing Team Defensive Shape',
          'Verbal Communication',
          'Maintaining Connection and Compactness',
          'Screening Middle and Press Forward & Wide',
          'Supporting and Providing Cover',
          'Building and Initiating Pressure',
          'Opportunity to Regain',
          'Deny Forward Passes',
          'Protect the space in front of backs'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1',
          'Challenge, intercept, tackle',
          'Prevent Scoring & Deny Danger Zone Entry',
          'MIB',
          'Tracking Runners',
          'Clearances & Managing 2nd Phase'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Provide Organization and Anticipate Threats',
          'Press vs. Regroup to Repress',
          'Delay-Deny-Dictate',
          'Keep Play in front'
        ]
      }
    }
  },
  'Forward': {
    name: 'Forward',
    categories: {
      attacking_organized: {
        title: 'Attacking Organized',
        points: [
          'Supporting Build Up',
          'Create Height',
          'Discipline in positioning- timing',
          'Reading opponent\'s pressure',
          'Movement and Interchange',
          'Between & Behind Lines',
          'Threatening',
          'Timing',
          'Receiving Under Pressure',
          'Spatial and positional Awareness',
          'Back to Goal, Facing Up, Combination Play',
          'Possession to Advance Forward and Break Final Line',
          'Dribble or Pass',
          'Dominating 1v1',
          'Take-on',
          'Create'
        ]
      },
      attacking_final_third: {
        title: 'Attacking Final Third',
        points: [
          'Creating Chances and Scoring Goals',
          'Positioning in Goal Zone',
          'RIB',
          'Shots- type, technique, decisions',
          'Assists- through balls, crosses',
          'Anticipate and react',
          'Decision of when to pass vs. shoot'
        ]
      },
      attacking_transition: {
        title: 'Attacking Transition',
        points: [
          'Creating Counter Attack',
          'Movement to threaten and advance forward- most dangerous player',
          'High or wide',
          'Support to secure possession',
          'Post and hold',
          'Allow team to get into shape',
          'Combination Play'
        ]
      },
      defending_organized: {
        title: 'Defending Organized',
        points: [
          'Shaping and Dictating Play',
          'Positioning to make play predictable',
          'Delay-Deny-Dictate',
          'Ability to receive and execute information from deeper players',
          'Building and Initiating Pressure',
          'Press vs. Re-group to Press',
          'Collective and Connected to deeper lines',
          'Opportunity to Regain',
          'Opportunity to Double',
          'Deny forward pass and penetrations',
          'Take away time, space, options',
          'Screen middle, Press forward and wide',
          'Player Responsibility'
        ]
      },
      defending_final_third: {
        title: 'Defending Final Third',
        points: [
          'Dominating 1v1 Situations',
          'Challenge, intercept, tackle',
          'Prevent and Disrupt',
          'Prevent Goal Scoring Opportunities',
          'Connected and compact – vertical and horizontal',
          'Communication to help organize and manage threats- space or players',
          'Tracking Runners',
          'Opportunities to Double',
          'Managing 2nd Phase',
          'Positioning to Repress',
          'Challenge, intercept, Tackle'
        ]
      },
      defending_transition: {
        title: 'Defending Transition',
        points: [
          'Prevent Counter Attack',
          'Immediate Pressure',
          'Take away Time, Space, Options',
          'Press vs. Regroup to Repress',
          'Anticipate and Dealing with Threats- space or player'
        ]
      }
    }
  }
};