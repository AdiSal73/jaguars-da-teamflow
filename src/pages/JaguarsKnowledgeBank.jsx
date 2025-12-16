import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Target, TrendingUp, ChevronDown, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function JaguarsKnowledgeBank() {
  const positions = {
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
          { title: 'Management of Space', points: ['Protect the Space behind our back line - drop, step, hold', 'Space between lines - connected and compact - vertical and horizontal', 'Read Pressure'] },
          { title: 'Adjusting Starting Position', points: ['Anticipate and intercept through balls or passes', 'Continuously adjusting position'] }
        ],
        finalThird: [
          { title: 'Controlling the Box', points: ['Defending Crosses, long passes and 1v1 Situations', 'Intercept, catch, punch, deflect', 'Organization of MIB'] },
          { title: 'Protecting the Goal: Prevent Scoring', points: ['Making Saves - long, central, angled, close', 'Reacting immediately to recover for second phase if rebound'] }
        ],
        transition: [
          { title: 'Direct teammates and anticipate threats', points: ['Counter Measures', 'Protect most dangerous Space', 'Identify Threats & Marks'] },
          { title: 'Adjust positioning and body shape', points: ['Protect the Goal and Defend Space'] }
        ]
      },
      attacking: {
        balanced: [
          { title: 'Initiate build up and possession forward' },
          { title: 'Help break initial lines', points: ['Play around, through, beyond', 'Adjust body position to receive and play quickly'] },
          { title: 'Providing support & clearances', points: ['Connected to back line'] },
          { title: 'Help organize Countermeasures - Balance' }
        ],
        finalThird: [
          { title: 'Help to organize and keep ball in attacking half', points: ['Move and support behind the ball'] },
          { title: 'Help to organize Countermeasures - Balance', points: ['Plus 1 Defensively'] }
        ],
        transition: [
          { title: 'Initiate Counter Attack', points: ['Break out and find highest option', 'Throw or kick'] },
          { title: 'Initiate Build-up', points: ['Maintain possession – allow team to regain shape'] },
          { title: 'Push up defensive line - keep team connected' }
        ]
      }
    },
    CB: {
      title: 'Center Back',
      icon: '🛡️',
      role: ['Master 1v1 duels', 'Dominate aerial challenges', 'Build out of the back', 'Organize and communicate'],
      traits: [
        'Strength & Power, Speed & Agility',
        'Calm, Decisive, Relentless',
        'Communication - Directing & Organizing',
        'Dominate in 1v1 Situations (tackling, intercepting, heading)',
        'Marking & Protecting Danger Zone',
        'Reading Pressure',
        'Ball winner - tackling, heading, intercepting, & clearances',
        'Range of Passing - initiate build'
      ],
      defending: {
        balanced: [
          { title: 'Organization - Verbal Communication', points: ['Team Shape to Dictate Play', 'Recognize opponent shape and reading pressure'] },
          { title: 'Management of Space and Threats', points: ['Compact and connected between lines - vertical and horizontal', 'Line Management - drop, step, hold', 'Player Responsibility - track runners & provide cover'] },
          { title: 'Protect the space behind and in front of line', points: ['Body Shape & positioning - side on/ ball side-goal side', 'Deny and disrupt Forward Passes'] },
          { title: 'Dominating 1v1 - Ball Winner', points: ['Challenge, intercept, tackle'] }
        ],
        finalThird: [
          { title: 'Defending in the Box', points: ['Recovery runs', 'Zonal and man marking', 'Defending ball side', 'Attacking first ball', 'Winning second ball'] },
          { title: 'Win Every Duel', points: ['Every tackle', 'Every aerial challenge', 'Block every shot', 'Deny every cross'] }
        ],
        transition: [
          { title: 'Recovery and Organization', points: ['Recovery runs', 'Communicate and organize', 'Protect most dangerous space'] },
          { title: 'Immediate Response', points: ['Body shape and positioning', 'Win duels and second balls'] }
        ]
      },
      attacking: {
        balanced: [
          { title: 'Initiate build up', points: ['First pass to break pressure'] },
          { title: 'Breaking initial lines', points: ['Range of passing', 'Body shape to receive under pressure'] },
          { title: 'Providing Balance', points: ['Support behind the ball', 'Countermeasures'] }
        ],
        finalThird: [
          { title: 'Attacking Set Pieces', points: ['Target for corners and free kicks', 'Dominant in aerial battles'] },
          { title: 'Support Attack', points: ['Push up when appropriate', 'Provide options'] }
        ],
        transition: [
          { title: 'Quick Transition Forward', points: ['Recognize counter-attack opportunity', 'Long pass to attackers'] },
          { title: 'Build-up', points: ['Maintain possession', 'Allow team to push up'] }
        ]
      }
    },
    OB: {
      title: 'Outside Back',
      icon: '⚡',
      role: ['Master 1v1 duels', 'Build out of the back', 'Join the attack and create overloads', 'Cover the weak side'],
      traits: [
        'Fast & Agile, Quick, and Fit',
        'Energetic and Dynamic',
        'Dominate in 1v1 Situations (tackling, intercepting, taking on)',
        'Marking, Denying Service & Clearances',
        'Support - providing width, height, and balance',
        'Combination Play',
        'Create Chances - crosses, shots'
      ],
      defending: {
        balanced: [
          { title: 'Reading and Positioning', points: ['Communication - Help to Organize', 'Delay-Deny-Dictate', 'Screen Middle and Press Wide', 'Partnership with Wide Forward and Center Back', 'Press vs. Regroup to Repress'] },
          { title: 'Anticipating and Preventing Threats', points: ['Protect Space Behind the Line', 'Line Management - drop, step, hold', 'Body Shape: side on/ ball side-goal side', 'Player Responsibility - track runners & provide cover'] },
          { title: 'Dominating 1v1', points: ['Challenge, intercept, tackle, wall pass defending, aerial battles', 'Flank Defending', 'Regain in Pressure Pocket'] }
        ],
        finalThird: [
          { title: 'Defending the Box', points: ['Recovery runs', 'Defensive positioning', 'Clear crosses', 'Win aerial duels'] }
        ],
        transition: [
          { title: 'Recovery', points: ['Sprint back to cover', 'Communicate with center backs', 'Protect space behind'] }
        ]
      },
      attacking: {
        balanced: [
          { title: 'Provide width and attacking support', points: ['Overlapping runs', 'Stretching opponent defense'] },
          { title: 'Build-up Play', points: ['Receive under pressure', 'Combination play with midfielders'] },
          { title: 'Creating Opportunities', points: ['Crossing and delivery', 'Support in wide areas'] }
        ],
        finalThird: [
          { title: 'Create overloads', points: ['Get into crossing positions', '2v1 situations wide'] },
          { title: 'Crossing and Finishing', points: ['Quality crosses', 'Cut inside and shoot'] }
        ],
        transition: [
          { title: 'Join Counter-Attack', points: ['Sprint forward quickly', 'Provide width in transition'] },
          { title: 'Support Build-up', points: ['Outlet pass option', 'Stretch opponent'] }
        ]
      }
    },
    DM: {
      title: 'Defensive Midfielder',
      icon: '🔒',
      role: ['Master 1v1 duels', 'Advance and switch the ball', 'Win aerial challenges', 'Organize the press and transition'],
      traits: [
        'Strong, quick, fit',
        'Controlled, insightful, and disciplined',
        'Leader',
        'Spatial Awareness (360º) - scanning',
        'Ball winner (tackling, intercepting, heading)',
        'Providing offensive & defensive balance',
        'Ability to Break Pressure - dribble & passing (COP)',
        'Range of Passes'
      ],
      defending: {
        balanced: [
          { title: 'Organizing Team Defensive Shape', points: ['Verbal Communication', 'Maintaining Connection and Compactness between lines - vertical and horizontal', 'Screening Middle and Press Forward & Wide', 'Supporting and Providing Cover to Forward Line'] },
          { title: 'Building and Initiating Pressure', points: ['Regroup to Repress', 'Opportunity to Regain'] },
          { title: 'Anticipating and Preventing Threats', points: ['Deny Forward Passes and Penetrations', 'Protect the space in front of backs and screen entry passes', 'Player Responsibility - track runners & provide cover', 'Defend Vertical Middle'] },
          { title: 'Dominating 1v1', points: ['Challenge, intercept, tackle, aerial battles'] }
        ],
        finalThird: [
          { title: 'Protect the Box', points: ['Position in front of defense', 'Screen dangerous passes', 'Win second balls'] }
        ],
        transition: [
          { title: 'Immediate Organization', points: ['Drop and cover', 'Communicate threats', 'Protect space'] }
        ]
      },
      attacking: {
        balanced: [
          { title: 'Breaking pressure with passes or dribbles', points: ['Receive under pressure', 'Progressive passing'] },
          { title: 'Range of passing to switch play', points: ['Long passes to switch sides', 'Breaking lines'] },
          { title: 'Supporting forward movement', points: ['Link defense to attack'] },
          { title: 'Providing balance and connection', points: ['Safety outlet', 'Recycle possession'] }
        ],
        finalThird: [
          { title: 'Support Attack', points: ['Late runs into box', 'Shots from distance'] },
          { title: 'Create Space', points: ['Draw opponents', 'Open passing lanes'] }
        ],
        transition: [
          { title: 'Quick Distribution', points: ['Fast forward pass', 'Start counter-attack'] },
          { title: 'Advance with Ball', points: ['Drive forward with ball', 'Create numerical advantage'] }
        ]
      }
    },
    AM: {
      title: 'Attacking Midfielder',
      icon: '⭐',
      role: ['Create scoring chances', 'Advance the ball overload midfield', 'Finish scoring chances', 'Press and win the ball back'],
      traits: [
        'Fast & agile, quick, and fit',
        'Creative and Dangerous',
        'Spatial Awareness - body position to break lines and to delay, deny, dictate',
        'Precise - receiving, dribbling, passing',
        'Combination Play - movement & interchange',
        'Play Maker & Creator of Chances - through balls, shots (range of finishing)',
        'Shape Play: Delay-Deny-Dictate'
      ],
      defending: {
        balanced: [
          { title: 'Dictating and Shaping Play', points: ['Make Play Predictable', 'Delay-Deny-Dictate', 'Compacted and Connected - Vertical and Horizontal', 'Screen Middle, Press forward and wide', 'Communication and support to forward line'] },
          { title: 'Building and Initiating Pressure', points: ['Press vs. Regroup to Repress', 'Opportunity to Regain'] },
          { title: 'Deny forward passes and penetrations', points: ['Player responsibility', 'Protecting most dangerous space - See one, screen one', 'Defend Vertical Middle'] },
          { title: 'Dominating 1v1 Situations', points: ['Challenge, intercept, tackle, aerial battles'] }
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
          { title: 'Create scoring chances', points: ['Through balls', 'Key passes'] },
          { title: 'Break through lines with passing or dribbling', points: ['Progressive carries', 'Take on defenders'] },
          { title: 'Combination play and movement', points: ['Quick interchanges', 'One-twos'] },
          { title: 'Finishing from distance', points: ['Shots outside box'] }
        ],
        finalThird: [
          { title: 'Final Pass', points: ['Assist creation', 'Unlock defenses'] },
          { title: 'Finishing', points: ['Score from edge of box', 'Late runs to finish'] }
        ],
        transition: [
          { title: 'Quick Attack', points: ['Receive and turn', 'Drive at defense'] },
          { title: 'Link Play', points: ['Connect midfield to forwards', 'Quick combination'] }
        ]
      }
    },
    WF: {
      title: 'Wide Forward',
      icon: '🔥',
      role: ['Finish scoring chances', 'Create scoring chances', 'Create wide overloads', 'Press and win the ball back'],
      traits: [
        'Quick, explosive, and agile',
        'Creative and Energetic',
        'Movement and interchange to break lines of pressure (wide and central)',
        'Dominate in 1v1 Situations (taking on, tackling, intercepting)',
        'Track Back',
        'Dictate play and defend wide space - intercept and tackle',
        'Creating Chances - crosses, shots, RIB'
      ],
      defending: {
        balanced: [
          { title: 'Shaping and Dictating Play', points: ['Screen Middle, Press Forward and Wide', 'Positioning', "Recognizing opponent's build up", 'Ability to receive and execute information from deeper players'] },
          { title: 'Building and Initiating Pressure', points: ['Press vs. Re-group to Press', 'Opportunity to Regain', 'Opportunity to Double'] },
          { title: 'Deny forward pass and penetrations', points: ['Take away time, space, options', 'Player Responsibility'] },
          { title: 'Dominating 1v1 Situations', points: ['Challenge, intercept, tackle, Wall pass defending', 'Flank Defending', 'Prevent and Disrupt', 'Regain in Pressure Pocket'] }
        ],
        finalThird: [
          { title: 'High Press', points: ['Force play wide', 'Win ball back'] }
        ],
        transition: [
          { title: 'Track Back', points: ['Sprint back to help defense', 'Support fullback'] }
        ]
      },
      attacking: {
        balanced: [
          { title: 'Wide Play', points: ['Stretch defense', 'Create 1v1 situations'] },
          { title: 'Cut Inside', points: ['Attack central areas', 'Shoot on goal'] },
          { title: 'Combination Play', points: ['Link with fullback', 'Interchange positions'] }
        ],
        finalThird: [
          { title: 'Finish scoring chances', points: ['Clinical finishing', 'Various techniques'] },
          { title: 'Create scoring chances', points: ['Quality crosses', 'Cut backs', 'Take on defenders'] },
          { title: 'Wide overloads and 1v1 situations', points: ['Beat defender', '2v1 situations'] },
          { title: 'Movement to break defensive lines', points: ['Runs in behind', 'Diagonal runs'] }
        ],
        transition: [
          { title: 'Counter-Attack', points: ['Sprint in behind', 'Stretch defense'] },
          { title: 'Quick Combination', points: ['Fast link play', 'Release striker'] }
        ]
      }
    },
    CF: {
      title: 'Center Forward',
      icon: '⚽',
      role: ['Finish scoring chances', 'Create scoring chances', 'Hold up and link up play', 'Press and win the ball back'],
      traits: [
        'Strong, explosive, quick',
        'Dynamic and Dangerous',
        'Creating Chances & Scoring Goals',
        'Establishing Height',
        'Back to Pressure and posting up',
        'Threatening - movement and combination play',
        'Strength on ball - balance & control',
        'Dictate and Shape Play Defensively',
        'Dominant and relentless around the goal - ground and air'
      ],
      defending: {
        balanced: [
          { title: 'Shaping and Dictating Play', points: ['Positioning to make play predictable', 'Delay-Deny-Dictate', 'Ability to receive and execute information from deeper players'] },
          { title: 'Building and Initiating Pressure', points: ['Press to initiate team pressure', 'Force play into specific areas'] },
          { title: 'Make play predictable', points: ['Force to one side', 'Angle of approach'] },
          { title: 'Win duels and second balls', points: ['Physical battles', 'Compete for everything'] }
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
          { title: 'Movement', points: ['Create space for others', 'Pin defenders'] },
          { title: 'Build-up', points: ['Drop deep to receive', 'Connect play'] }
        ],
        finalThird: [
          { title: 'Finish scoring chances', points: ['Clinical finishing', 'Various techniques', 'Aerial goals'] },
          { title: 'Hold up and link up play', points: ['Back to goal', 'Lay offs', 'Flicks'] },
          { title: 'Create space for teammates', points: ['Drag defenders', 'Movement off ball'] },
          { title: 'Target for long balls and build up', points: ['Win aerial duels', 'Control difficult passes'] }
        ],
        transition: [
          { title: 'Target for Counter', points: ['Run in behind', 'Hold up play'] },
          { title: 'Quick Finish', points: ['First time shots', 'Fast decisions'] }
        ]
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredPositions = Object.entries(positions).filter(([key, position]) =>
    position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ResponsibilitySection = ({ title, data, icon: Icon }) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-emerald-600" />
        {title}
      </h4>
      
      <div className="space-y-3">
        <div>
          <div className="text-xs font-bold text-emerald-700 mb-1">Balanced (Organized)</div>
          {data.balanced.map((item, idx) => (
            <div key={idx} className="mb-2">
              <div className="text-xs font-semibold text-slate-800">{item.title}</div>
              {item.points && (
                <ul className="ml-3 space-y-0.5">
                  {item.points.map((point, pidx) => (
                    <li key={pidx} className="text-xs text-slate-600 flex items-start gap-1">
                      <span className="text-emerald-500">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs font-bold text-emerald-700 mb-1">Final Third</div>
          {data.finalThird.map((item, idx) => (
            <div key={idx} className="mb-2">
              <div className="text-xs font-semibold text-slate-800">{item.title}</div>
              {item.points && (
                <ul className="ml-3 space-y-0.5">
                  {item.points.map((point, pidx) => (
                    <li key={pidx} className="text-xs text-slate-600 flex items-start gap-1">
                      <span className="text-emerald-500">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs font-bold text-emerald-700 mb-1">Transition</div>
          {data.transition.map((item, idx) => (
            <div key={idx} className="mb-2">
              <div className="text-xs font-semibold text-slate-800">{item.title}</div>
              {item.points && (
                <ul className="ml-3 space-y-0.5">
                  {item.points.map((point, pidx) => (
                    <li key={pidx} className="text-xs text-slate-600 flex items-start gap-1">
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            Jaguars Player Knowledge Bank
          </h1>
          <p className="text-slate-600 mb-4">Position-specific traits, roles, and responsibilities</p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {filteredPositions.map(([key, position]) => (
            <AccordionItem key={key} value={key} className="border-none">
              <Card className="border-none shadow-xl overflow-hidden">
                <AccordionTrigger className="hover:no-underline p-0">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white w-full">
                    <div className="flex items-center justify-between w-full pr-4">
                      <CardTitle className="flex items-center gap-3">
                        <span className="text-3xl">{position.icon}</span>
                        <span>{position.title}</span>
                      </CardTitle>
                      <ChevronDown className="w-5 h-5 transition-transform" />
                    </div>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="p-6 space-y-6">
                    {/* Role */}
                    <div>
                      <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-600" />
                        Primary Role
                      </h3>
                      <div className="grid md:grid-cols-2 gap-2">
                        {position.role.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-emerald-50 p-2 rounded">
                            <span className="text-emerald-500">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Traits */}
                    <div>
                      <h3 className="font-bold text-emerald-900 mb-3">Key Traits</h3>
                      <div className="grid md:grid-cols-2 gap-2">
                        {position.traits.map((trait, idx) => (
                          <div key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-blue-50 p-2 rounded">
                            <span className="text-blue-500">✓</span>
                            <span>{trait}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Defending Responsibilities */}
                    <ResponsibilitySection
                      title="Defending Responsibilities"
                      data={position.defending}
                      icon={Shield}
                    />

                    {/* Attacking Responsibilities */}
                    <ResponsibilitySection
                      title="Attacking Responsibilities"
                      data={position.attacking}
                      icon={TrendingUp}
                    />
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}