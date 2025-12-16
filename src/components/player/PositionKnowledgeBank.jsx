import React from 'react';
import { BookOpen, Shield, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { POSITION_KNOWLEDGE_BANK } from '../constants/positionKnowledgeBank';

const POSITIONS_DATA_OLD = {
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

export default function PositionKnowledgeBank({ position }) {
  const knowledge = POSITION_KNOWLEDGE_BANK[position];

  if (!knowledge) {
    return null;
  }

  const ResponsibilityCard = ({ title, data, icon: Icon, gradient }) => (
    <div className="space-y-3">
      <div className={`bg-gradient-to-r ${gradient} text-white p-3 rounded-t-xl`}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
      </div>
      
      <div className="space-y-3 p-3 bg-white rounded-b-xl">
        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-700">Balanced</div>
          {data.balanced.map((item, idx) => (
            <div key={idx}>
              <div className="text-xs font-semibold text-slate-800">{item.title}</div>
              {item.points && (
                <ul className="ml-2 space-y-0.5">
                  {item.points.map((point, pidx) => (
                    <li key={pidx} className="text-[10px] text-slate-600 flex items-start gap-1">
                      <span className="text-emerald-500">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-bold text-emerald-700">Final Third</div>
          {data.finalThird.map((item, idx) => (
            <div key={idx}>
              <div className="text-xs font-semibold text-slate-800">{item.title}</div>
              {item.points && (
                <ul className="ml-2 space-y-0.5">
                  {item.points.map((point, pidx) => (
                    <li key={pidx} className="text-[10px] text-slate-600 flex items-start gap-1">
                      <span className="text-emerald-500">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs font-bold text-emerald-700">Transition</div>
          {data.transition.map((item, idx) => (
            <div key={idx}>
              <div className="text-xs font-semibold text-slate-800">{item.title}</div>
              {item.points && (
                <ul className="ml-2 space-y-0.5">
                  {item.points.map((point, pidx) => (
                    <li key={pidx} className="text-[10px] text-slate-600 flex items-start gap-1">
                      <span className="text-emerald-500">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border-none shadow-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-b border-emerald-400/30">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{knowledge.icon}</span>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {knowledge.title} Knowledge Bank
            </CardTitle>
            <p className="text-xs text-white/90 mt-1">Position-specific tactical responsibilities</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-br from-emerald-50 to-green-50">
        {/* Role & Traits */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Primary Role
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {knowledge.role.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs bg-emerald-50 p-2 rounded">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span className="text-slate-800">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <CardTitle className="text-sm">Key Traits</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {knowledge.traits.map((trait, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs bg-blue-50 p-2 rounded">
                    <span className="text-blue-600">✓</span>
                    <span className="text-slate-800">{trait}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responsibilities Bento Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <ResponsibilityCard
            title="Defending Responsibilities"
            data={knowledge.defending}
            icon={Shield}
            gradient="from-red-600 to-orange-600"
          />
          
          <ResponsibilityCard
            title="Attacking Responsibilities"
            data={knowledge.attacking}
            icon={TrendingUp}
            gradient="from-emerald-600 to-green-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}