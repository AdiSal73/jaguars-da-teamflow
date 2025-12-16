
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

export const POSITION_KNOWLEDGE_BANK = {
  GK: {
    title: 'Goalkeeper',
    icon: '🧤',
    role: ['Shot Stopping', 'Controlling the box', 'Distribution', 'Organization'],
    traits: [
      'Strength & Power – Explosive, Agility, & Balance',
      'Composed',
      'Communication - Directing & Organizing',
      'Shot stopping, Service (wide or central), Breakaways and Entry passes',
      'Distribution - range of passing',
      'Reading Pressure',
      'Managing Space'
    ],
    defending: {
      balanced: [
        { title: 'Helping Defensive Organization', points: ['Recognizing Threats - Space or Players', 'Organizing Team Shape to dictate play'] },
        { title: 'Management of Space', points: ['Protect the Space behind our back line - drop, step, hold', 'Space between lines - connected and compact', 'Read Pressure'] },
        { title: 'Adjusting Starting Position', points: ['Anticipate and intercept through balls', 'Continuously adjusting position'] }
      ],
      finalThird: [
        { title: 'Controlling the Box', points: ['Defending Crosses, long passes and 1v1 Situations', 'Intercept, catch, punch, deflect'] },
        { title: 'Protecting the Goal', points: ['Making Saves - long, central, angled, close', 'React immediately to recover'] }
      ],
      transition: [
        { title: 'Direct teammates', points: ['Counter Measures', 'Protect dangerous Space', 'Identify Threats'] },
        { title: 'Adjust positioning', points: ['Protect the Goal and Defend Space'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Initiate build up', points: ['Help break initial lines', 'Adjust body position to receive and play quickly'] },
        { title: 'Providing support', points: ['Connected to back line', 'Help organize Countermeasures'] }
      ],
      finalThird: [
        { title: 'Keep ball in attacking half', points: ['Move and support behind the ball', 'Plus 1 Defensively'] }
      ],
      transition: [
        { title: 'Initiate Counter Attack', points: ['Break out and find highest option', 'Throw or kick'] },
        { title: 'Initiate Build-up', points: ['Maintain possession – allow team to regain shape', 'Push up defensive line'] }
      ]
    }
  },
  'Right Centerback': {
    title: 'Center Back',
    icon: '🛡️',
    role: ['Master 1v1 duels', 'Dominate aerial challenges', 'Build out of the back', 'Organize and communicate'],
    traits: [
      'Strength & Power, Speed & Agility',
      'Calm, Decisive, Relentless',
      'Communication - Directing & Organizing',
      'Dominate in 1v1 Situations',
      'Ball winner',
      'Range of Passing'
    ],
    defending: {
      balanced: [
        { title: 'Organization', points: ['Team Shape to Dictate Play', 'Recognize opponent shape'] },
        { title: 'Management of Space', points: ['Compact and connected between lines', 'Line Management - drop, step, hold'] },
        { title: 'Dominating 1v1', points: ['Challenge, intercept, tackle'] }
      ],
      finalThird: [
        { title: 'Defending in the Box', points: ['Recovery runs', 'Zonal and man marking', 'Attacking first ball'] },
        { title: 'Win Every Duel', points: ['Every tackle', 'Every aerial challenge', 'Block every shot'] }
      ],
      transition: [
        { title: 'Recovery', points: ['Recovery runs', 'Communicate and organize', 'Protect dangerous space'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Initiate build up', points: ['First pass to break pressure', 'Range of passing'] },
        { title: 'Providing Balance', points: ['Support behind the ball', 'Countermeasures'] }
      ],
      finalThird: [
        { title: 'Attacking Set Pieces', points: ['Target for corners', 'Dominant in aerial battles'] }
      ],
      transition: [
        { title: 'Quick Transition', points: ['Recognize counter-attack opportunity', 'Long pass to attackers'] }
      ]
    }
  },
  'Left Centerback': {
    title: 'Center Back',
    icon: '🛡️',
    role: ['Master 1v1 duels', 'Dominate aerial challenges', 'Build out of the back', 'Organize and communicate'],
    traits: [
      'Strength & Power, Speed & Agility',
      'Calm, Decisive, Relentless',
      'Communication - Directing & Organizing',
      'Dominate in 1v1 Situations',
      'Ball winner',
      'Range of Passing'
    ],
    defending: {
      balanced: [
        { title: 'Organization', points: ['Team Shape to Dictate Play', 'Recognize opponent shape'] },
        { title: 'Management of Space', points: ['Compact and connected between lines', 'Line Management - drop, step, hold'] },
        { title: 'Dominating 1v1', points: ['Challenge, intercept, tackle'] }
      ],
      finalThird: [
        { title: 'Defending in the Box', points: ['Recovery runs', 'Zonal and man marking', 'Attacking first ball'] },
        { title: 'Win Every Duel', points: ['Every tackle', 'Every aerial challenge', 'Block every shot'] }
      ],
      transition: [
        { title: 'Recovery', points: ['Recovery runs', 'Communicate and organize', 'Protect dangerous space'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Initiate build up', points: ['First pass to break pressure', 'Range of passing'] },
        { title: 'Providing Balance', points: ['Support behind the ball', 'Countermeasures'] }
      ],
      finalThird: [
        { title: 'Attacking Set Pieces', points: ['Target for corners', 'Dominant in aerial battles'] }
      ],
      transition: [
        { title: 'Quick Transition', points: ['Recognize counter-attack opportunity', 'Long pass to attackers'] }
      ]
    }
  },
  'Right Outside Back': {
    title: 'Outside Back',
    icon: '⚡',
    role: ['Master 1v1 duels', 'Build out of the back', 'Join attack', 'Cover weak side'],
    traits: [
      'Fast & Agile, Quick, and Fit',
      'Energetic and Dynamic',
      'Dominate in 1v1 Situations',
      'Support - width and balance',
      'Create Chances'
    ],
    defending: {
      balanced: [
        { title: 'Reading and Positioning', points: ['Delay-Deny-Dictate', 'Screen Middle and Press Wide', 'Partnership with CB'] },
        { title: 'Preventing Threats', points: ['Protect Space Behind', 'Track runners', 'Body Shape'] },
        { title: 'Dominating 1v1', points: ['Challenge, intercept, tackle', 'Flank Defending'] }
      ],
      finalThird: [
        { title: 'Defending the Box', points: ['Recovery runs', 'Defensive positioning', 'Clear crosses'] }
      ],
      transition: [
        { title: 'Recovery', points: ['Sprint back', 'Communicate with CBs', 'Protect space'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Provide width', points: ['Overlapping runs', 'Stretching defense'] },
        { title: 'Build-up Play', points: ['Receive under pressure', 'Combination play'] }
      ],
      finalThird: [
        { title: 'Create overloads', points: ['Crossing positions', '2v1 situations'] },
        { title: 'Crossing and Finishing', points: ['Quality crosses', 'Cut inside and shoot'] }
      ],
      transition: [
        { title: 'Join Counter', points: ['Sprint forward', 'Provide width'] }
      ]
    }
  },
  'Left Outside Back': {
    title: 'Outside Back',
    icon: '⚡',
    role: ['Master 1v1 duels', 'Build out of the back', 'Join attack', 'Cover weak side'],
    traits: [
      'Fast & Agile, Quick, and Fit',
      'Energetic and Dynamic',
      'Dominate in 1v1 Situations',
      'Support - width and balance',
      'Create Chances'
    ],
    defending: {
      balanced: [
        { title: 'Reading and Positioning', points: ['Delay-Deny-Dictate', 'Screen Middle and Press Wide', 'Partnership with CB'] },
        { title: 'Preventing Threats', points: ['Protect Space Behind', 'Track runners', 'Body Shape'] },
        { title: 'Dominating 1v1', points: ['Challenge, intercept, tackle', 'Flank Defending'] }
      ],
      finalThird: [
        { title: 'Defending the Box', points: ['Recovery runs', 'Defensive positioning', 'Clear crosses'] }
      ],
      transition: [
        { title: 'Recovery', points: ['Sprint back', 'Communicate with CBs', 'Protect space'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Provide width', points: ['Overlapping runs', 'Stretching defense'] },
        { title: 'Build-up Play', points: ['Receive under pressure', 'Combination play'] }
      ],
      finalThird: [
        { title: 'Create overloads', points: ['Crossing positions', '2v1 situations'] },
        { title: 'Crossing and Finishing', points: ['Quality crosses', 'Cut inside and shoot'] }
      ],
      transition: [
        { title: 'Join Counter', points: ['Sprint forward', 'Provide width'] }
      ]
    }
  },
  'Defensive Midfielder': {
    title: 'Defensive Midfielder',
    icon: '🔒',
    role: ['Master 1v1 duels', 'Advance and switch', 'Win aerial challenges', 'Organize press'],
    traits: [
      'Strong, quick, fit',
      'Controlled, insightful, disciplined',
      'Leader',
      'Spatial Awareness (360º)',
      'Ball winner',
      'Range of Passes'
    ],
    defending: {
      balanced: [
        { title: 'Organizing Shape', points: ['Verbal Communication', 'Connection between lines', 'Screening Middle'] },
        { title: 'Building Pressure', points: ['Regroup to Repress', 'Opportunity to Regain'] },
        { title: 'Preventing Threats', points: ['Deny Forward Passes', 'Protect space in front', 'Defend Vertical Middle'] }
      ],
      finalThird: [
        { title: 'Protect the Box', points: ['Position in front of defense', 'Screen passes', 'Win second balls'] }
      ],
      transition: [
        { title: 'Organization', points: ['Drop and cover', 'Communicate threats', 'Protect space'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Breaking pressure', points: ['Receive under pressure', 'Progressive passing'] },
        { title: 'Range of passing', points: ['Switch play', 'Breaking lines'] },
        { title: 'Balance', points: ['Safety outlet', 'Recycle possession'] }
      ],
      finalThird: [
        { title: 'Support Attack', points: ['Late runs', 'Shots from distance'] }
      ],
      transition: [
        { title: 'Quick Distribution', points: ['Fast forward pass', 'Start counter'] }
      ]
    }
  },
  'Center Midfielder': {
    title: 'Center Midfielder',
    icon: '⚙️',
    role: ['Link defense and attack', 'Control tempo', 'Create chances', 'Win duels'],
    traits: [
      'Quality with both feet',
      'Forward passing',
      'Shooting from distance',
      'Tackling and ball winning',
      'Range of passing'
    ],
    defending: {
      balanced: [
        { title: 'Defensive support', points: ['Cut passing lanes', 'Tracking runners'] },
        { title: 'Support play', points: ['Receiving angles', 'Connection between lines'] }
      ],
      finalThird: [
        { title: 'Protect Box', points: ['Position defensively', 'Win second balls'] }
      ],
      transition: [
        { title: 'Quick reaction', points: ['Counter-press', 'Delay opponent'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Passing range', points: ['Breaking lines', 'Creating space'] },
        { title: 'Transition piece', points: ['Quick decision making', 'Vertical movement'] }
      ],
      finalThird: [
        { title: 'Support Attack', points: ['Late runs', 'Shooting'] }
      ],
      transition: [
        { title: 'Link Play', points: ['Connect lines', 'Quick combination'] }
      ]
    }
  },
  'Attacking Midfielder': {
    title: 'Attacking Midfielder',
    icon: '⭐',
    role: ['Create chances', 'Advance ball', 'Finish chances', 'Press and win back'],
    traits: [
      'Fast & agile, quick, and fit',
      'Creative and Dangerous',
      'Spatial Awareness',
      'Precise - receiving, dribbling, passing',
      'Play Maker'
    ],
    defending: {
      balanced: [
        { title: 'Dictating Play', points: ['Make Play Predictable', 'Delay-Deny-Dictate', 'Screen Middle'] },
        { title: 'Building Pressure', points: ['Press vs. Regroup', 'Opportunity to Regain'] },
        { title: 'Deny passes', points: ['Player responsibility', 'Protect dangerous space'] }
      ],
      finalThird: [
        { title: 'High Press', points: ['Force mistakes', 'Win ball in dangerous areas'] }
      ],
      transition: [
        { title: 'Immediate Pressure', points: ['Counter-press', 'Delay opponent'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Create chances', points: ['Through balls', 'Key passes'] },
        { title: 'Break lines', points: ['Progressive carries', 'Take on defenders'] },
        { title: 'Combination play', points: ['Quick interchanges', 'One-twos'] }
      ],
      finalThird: [
        { title: 'Final Pass', points: ['Assist creation', 'Unlock defenses'] },
        { title: 'Finishing', points: ['Score from edge', 'Late runs'] }
      ],
      transition: [
        { title: 'Quick Attack', points: ['Receive and turn', 'Drive at defense'] }
      ]
    }
  },
  'Right Winger': {
    title: 'Wide Forward',
    icon: '🔥',
    role: ['Finish chances', 'Create chances', 'Wide overloads', 'Press and win back'],
    traits: [
      'Quick, explosive, agile',
      'Creative and Energetic',
      'Movement to break lines',
      'Dominate in 1v1',
      'Creating Chances'
    ],
    defending: {
      balanced: [
        { title: 'Shaping Play', points: ['Screen Middle', 'Press Forward and Wide', 'Recognizing build up'] },
        { title: 'Building Pressure', points: ['Press vs. Re-group', 'Opportunity to Regain'] },
        { title: 'Deny passes', points: ['Take away time, space', 'Flank Defending'] }
      ],
      finalThird: [
        { title: 'High Press', points: ['Force play wide', 'Win ball back'] }
      ],
      transition: [
        { title: 'Track Back', points: ['Sprint back', 'Support fullback'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Wide Play', points: ['Stretch defense', 'Create 1v1'] },
        { title: 'Cut Inside', points: ['Attack central', 'Shoot on goal'] }
      ],
      finalThird: [
        { title: 'Finish chances', points: ['Clinical finishing', 'Various techniques'] },
        { title: 'Create chances', points: ['Quality crosses', 'Cut backs', 'Take on defenders'] },
        { title: 'Movement', points: ['Runs in behind', 'Diagonal runs'] }
      ],
      transition: [
        { title: 'Counter-Attack', points: ['Sprint in behind', 'Stretch defense'] }
      ]
    }
  },
  'Left Winger': {
    title: 'Wide Forward',
    icon: '🔥',
    role: ['Finish chances', 'Create chances', 'Wide overloads', 'Press and win back'],
    traits: [
      'Quick, explosive, agile',
      'Creative and Energetic',
      'Movement to break lines',
      'Dominate in 1v1',
      'Creating Chances'
    ],
    defending: {
      balanced: [
        { title: 'Shaping Play', points: ['Screen Middle', 'Press Forward and Wide', 'Recognizing build up'] },
        { title: 'Building Pressure', points: ['Press vs. Re-group', 'Opportunity to Regain'] },
        { title: 'Deny passes', points: ['Take away time, space', 'Flank Defending'] }
      ],
      finalThird: [
        { title: 'High Press', points: ['Force play wide', 'Win ball back'] }
      ],
      transition: [
        { title: 'Track Back', points: ['Sprint back', 'Support fullback'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Wide Play', points: ['Stretch defense', 'Create 1v1'] },
        { title: 'Cut Inside', points: ['Attack central', 'Shoot on goal'] }
      ],
      finalThird: [
        { title: 'Finish chances', points: ['Clinical finishing', 'Various techniques'] },
        { title: 'Create chances', points: ['Quality crosses', 'Cut backs', 'Take on defenders'] },
        { title: 'Movement', points: ['Runs in behind', 'Diagonal runs'] }
      ],
      transition: [
        { title: 'Counter-Attack', points: ['Sprint in behind', 'Stretch defense'] }
      ]
    }
  },
  Forward: {
    title: 'Center Forward',
    icon: '⚽',
    role: ['Finish chances', 'Create chances', 'Hold up and link', 'Press and win back'],
    traits: [
      'Strong, explosive, quick',
      'Dynamic and Dangerous',
      'Creating Chances & Scoring Goals',
      'Back to Pressure',
      'Strength on ball'
    ],
    defending: {
      balanced: [
        { title: 'Shaping Play', points: ['Make play predictable', 'Delay-Deny-Dictate'] },
        { title: 'Building Pressure', points: ['Press to initiate', 'Force play'] },
        { title: 'Win duels', points: ['Physical battles', 'Compete for everything'] }
      ],
      finalThird: [
        { title: 'High Press', points: ['Pressure center backs', 'Force mistakes'] }
      ],
      transition: [
        { title: 'Immediate Press', points: ['Counter-press', 'Prevent counter'] }
      ]
    },
    attacking: {
      balanced: [
        { title: 'Target Play', points: ['Hold up ball', 'Link with teammates'] },
        { title: 'Movement', points: ['Create space', 'Pin defenders'] }
      ],
      finalThird: [
        { title: 'Finish chances', points: ['Clinical finishing', 'Various techniques', 'Aerial goals'] },
        { title: 'Hold up and link', points: ['Back to goal', 'Lay offs', 'Flicks'] },
        { title: 'Create space', points: ['Drag defenders', 'Movement off ball'] }
      ],
      transition: [
        { title: 'Target for Counter', points: ['Run in behind', 'Hold up play'] }
      ]
    }
  }
};

// For backward compatibility
export const POSITION_KNOWLEDGE = POSITION_KNOWLEDGE_BANK;
