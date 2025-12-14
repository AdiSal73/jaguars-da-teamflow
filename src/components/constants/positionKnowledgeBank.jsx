export const PHYSICAL_ASSESSMENTS = {
  Speed: {
    description: 'Sprint speed measures a player\'s ability to accelerate quickly and maintain high velocity over short distances.',
    examples: ['20m sprint test', 'Flying 10m sprint', '30m acceleration test'],
    importance: 'Critical for beating defenders, recovering defensively, and covering ground quickly',
    training: ['Sprint drills', 'Plyometrics', 'Resistance training', 'Speed endurance work']
  },
  Power: {
    description: 'Jumping power and explosive strength measure a player\'s ability to generate force quickly, crucial for aerial duels and dynamic movements.',
    examples: ['Vertical jump test', 'Standing long jump', 'Counter movement jump'],
    importance: 'Essential for winning headers, powerful shooting, and explosive movements',
    training: ['Plyometric exercises', 'Olympic lifts', 'Box jumps', 'Medicine ball throws']
  },
  Endurance: {
    description: 'Cardiovascular endurance measures a player\'s ability to sustain high-intensity activity throughout a match.',
    examples: ['YIRT (Yo-Yo Intermittent Recovery Test)', 'Beep test', '12-minute run'],
    importance: 'Fundamental for maintaining performance levels throughout the full 90 minutes',
    training: ['Interval training', 'HIIT sessions', 'Long-distance runs', 'Small-sided games']
  },
  Agility: {
    description: 'Agility measures a player\'s ability to change direction quickly while maintaining control and balance.',
    examples: ['Shuttle run', 'T-test', '505 agility test', 'Illinois agility test'],
    importance: 'Key for dribbling, defending 1v1 situations, and quick transitions',
    training: ['Ladder drills', 'Cone drills', 'Change of direction exercises', 'Reactive agility work']
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