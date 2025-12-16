import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Target, Shield, TrendingUp, Users, ExternalLink, FileText, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CoachingResources() {
  const [selectedResource, setSelectedResource] = useState(null);

  const resources = [
    {
      id: 'pressing',
      title: 'How We Press',
      icon: TrendingUp,
      url: 'https://adisal.com/how-we-press/',
      description: 'Learn our pressing principles and how to win the ball high up the pitch',
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'defending-box',
      title: 'Defending Our Box',
      icon: Shield,
      url: 'https://adisal.com/defending-our-box/',
      description: 'Master defensive organization and protecting the goal',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'possession-midfield',
      title: 'Possession Through Midfield',
      icon: Users,
      url: 'https://adisal.com/possession-through-midfield/',
      description: 'Create overloads and break through the midfield',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'final-third',
      title: 'Overload Final Third',
      icon: Target,
      url: 'https://adisal.com/overload-final-third/',
      description: 'Attacking principles and creating scoring chances',
      color: 'from-emerald-500 to-green-500'
    },
    {
      id: 'building-out',
      title: 'Building Out of the Back',
      icon: BookOpen,
      url: 'https://adisal.com/building-out-of-the-back/',
      description: 'Learn to play out from the goalkeeper and build attacks',
      color: 'from-amber-500 to-yellow-500'
    }
  ];

  const playerTraits = {
    title: 'Jaguars Player Traits',
    url: 'https://adisal.com/jaguars-player-traits/',
    positions: [
      {
        name: 'Goalkeeper',
        traits: [
          'Strength & Power – Explosive, Agility, & Balance',
          'Composed',
          'Communication - Directing & Organizing',
          'Shot stopping, Service (wide or central), Breakaways and Entry passes',
          'Distribution - range of passing',
          'Reading Pressure',
          'Managing Space'
        ],
        responsibilities: {
          defending: [
            'Helping Defensive Organization',
            'Management of Space',
            'Adjusting Starting Position',
            'Controlling the Box',
            'Protecting the Goal'
          ],
          attacking: [
            'Initiate build up and possession forward',
            'Help break initial lines',
            'Providing support & clearances',
            'Initiate Counter Attack'
          ]
        }
      },
      {
        name: 'Center Back',
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
        responsibilities: {
          defending: [
            'Organization - Verbal Communication',
            'Management of Space and Threats',
            'Protect the space behind and in front of line',
            'Dominating 1v1 - Ball Winner'
          ],
          attacking: [
            'Initiate build up',
            'Breaking initial lines',
            'Range of passing',
            'Body shape to receive under pressure'
          ]
        }
      },
      {
        name: 'Outside Back',
        traits: [
          'Fast & Agile, Quick, and Fit',
          'Energetic and Dynamic',
          'Dominate in 1v1 Situations (tackling, intercepting, taking on)',
          'Marking, Denying Service & Clearances',
          'Support - providing width, height, and balance',
          'Combination Play',
          'Create Chances - crosses, shots'
        ],
        responsibilities: {
          defending: [
            'Reading and Positioning',
            'Delay-Deny-Dictate',
            'Screen Middle and Press Wide',
            'Anticipating and Preventing Threats',
            'Dominating 1v1 - Flank Defending'
          ],
          attacking: [
            'Provide width and attacking support',
            'Create overloads in wide areas',
            'Crossing and combination play',
            'Join the attack and create chances'
          ]
        }
      },
      {
        name: 'Defensive Midfielder',
        traits: [
          'Strong, quick, fit',
          'Controlled, insightful, and disciplined',
          'Leader',
          'Spatial Awareness (360º) - scanning',
          'Ball winner (tackling, intercepting, heading)',
          'Providing offensive & defensive balance',
          'Ability to Break Pressure - dribble & passing',
          'Range of Passes'
        ],
        responsibilities: {
          defending: [
            'Organizing Team Defensive Shape',
            'Building and Initiating Pressure',
            'Anticipating and Preventing Threats',
            'Dominating 1v1',
            'Screening Middle'
          ],
          attacking: [
            'Breaking pressure with passes or dribbles',
            'Range of passing to switch play',
            'Supporting forward movement',
            'Providing balance and connection'
          ]
        }
      },
      {
        name: 'Attacking Midfielder',
        traits: [
          'Fast & agile, quick, and fit',
          'Creative and Dangerous',
          'Spatial Awareness - body position to break lines',
          'Precise - receiving, dribbling, passing',
          'Combination Play - movement & interchange',
          'Play Maker & Creator of Chances',
          'Shape Play: Delay-Deny-Dictate'
        ],
        responsibilities: {
          defending: [
            'Dictating and Shaping Play',
            'Make Play Predictable',
            'Screen Middle, Press forward and wide',
            'Deny forward passes and penetrations'
          ],
          attacking: [
            'Create scoring chances',
            'Break through lines with passing or dribbling',
            'Combination play and movement',
            'Finishing from distance'
          ]
        }
      },
      {
        name: 'Wide Forward',
        traits: [
          'Quick, explosive, and agile',
          'Creative and Energetic',
          'Movement and interchange to break lines',
          'Dominate in 1v1 Situations (taking on, tackling, intercepting)',
          'Track Back',
          'Dictate play and defend wide space',
          'Creating Chances - crosses, shots, RIB'
        ],
        responsibilities: {
          defending: [
            'Shaping and Dictating Play',
            'Press vs. Re-group to Press',
            'Deny forward passes',
            'Flank Defending'
          ],
          attacking: [
            'Finish scoring chances',
            'Create scoring chances',
            'Wide overloads and 1v1 situations',
            'Movement to break defensive lines'
          ]
        }
      },
      {
        name: 'Center Forward',
        traits: [
          'Strong, explosive, quick',
          'Dynamic and Dangerous',
          'Creating Chances & Scoring Goals',
          'Establishing Height',
          'Back to Pressure and posting up',
          'Threatening - movement and combination play',
          'Strength on ball - balance & control',
          'Dominant around the goal - ground and air'
        ],
        responsibilities: {
          defending: [
            'Shaping and Dictating Play',
            'Press to initiate team pressure',
            'Make play predictable',
            'Win duels and second balls'
          ],
          attacking: [
            'Finish scoring chances',
            'Hold up and link up play',
            'Create space for teammates',
            'Target for long balls and build up'
          ]
        }
      }
    ]
  };

  const tacticalPrinciples = [
    {
      category: 'Pressing Principles',
      icon: TrendingUp,
      color: 'red',
      points: [
        {
          main: 'Reading the Cues',
          sub: [
            'When to setup the press',
            'Recognize triggers to deploy the press',
            'How to make play predictable',
            'Where to force the ball',
            'When and how to transition to the attack'
          ]
        },
        {
          main: '1v1 Defending to Win',
          sub: [
            'Intercept (arrive before the ball)',
            'Separate (arrive as the ball arrives)',
            'Deny the turn (force opponent to play back)',
            'Deny penetration (force opponent to play sideways and back)'
          ]
        },
        {
          main: 'Group Defending to Win',
          sub: [
            'Recognize individual and collective starting positions',
            'Closing gates (reducing space between players)',
            'Squeezing seams (reducing space between lines)',
            'Funneling the ball into pockets',
            'Double teaming and winning duels'
          ]
        },
        {
          main: 'Pressing to Score',
          sub: [
            'Recognizing moments to press',
            'Getting our pressing shape',
            'Collectively recognize triggers',
            'Force play to the trap',
            'Win the ball and look for key pass and runs'
          ]
        }
      ]
    },
    {
      category: 'Defending the Box',
      icon: Shield,
      color: 'blue',
      points: [
        {
          main: 'Group Defending Principles',
          sub: [
            'Closing gates (reducing space between players)',
            'Squeezing seams (reducing space between lines)',
            'Funneling the ball into pockets',
            'Double teaming and winning duels'
          ]
        },
        {
          main: 'Defending in the Box',
          sub: [
            'Recovery runs to get numbers back',
            'Zonal and man marking in the box',
            'Defending ball side',
            'Attacking first ball',
            'Winning second ball'
          ]
        },
        {
          main: 'Win Every Duel',
          sub: [
            'Every tackle',
            'Every aerial challenge',
            'Block every shot',
            'Deny every cross'
          ]
        }
      ]
    },
    {
      category: 'Possession Through Midfield',
      icon: Users,
      color: 'purple',
      points: [
        {
          main: 'Reading the Cues',
          sub: [
            'Shape and tendencies of opponent\'s midfield',
            'Awareness of space in seams',
            'Ability to combine and create overloads',
            'Quality of spacing and angles of support'
          ]
        },
        {
          main: 'We Possess to Score',
          sub: [
            'Entry pass - midfield rotates to create separation',
            'Find uncovered midfielder in seam 2',
            'Transition from midfield to creative phase'
          ]
        },
        {
          main: 'Think, Run, Pass Forward',
          sub: [
            'Think forward',
            'Run forward',
            'Pass forward'
          ]
        }
      ]
    },
    {
      category: 'Overload Final Third',
      icon: Target,
      color: 'emerald',
      points: [
        {
          main: 'Reading the Cues',
          sub: [
            'Opponent\'s line of restraint',
            'Shape and tendencies of opponent\'s backline',
            'Goalkeeper position',
            'Number of gates',
            'Who is defending zone 14'
          ]
        },
        {
          main: 'Combining to Score',
          sub: [
            'Create 2v1 situations in small spaces',
            'Collaboration and precision',
            'Read cues quicker',
            'Make purposeful runs',
            'Surgical passing and finishing'
          ]
        }
      ]
    },
    {
      category: 'Building Out of the Back',
      icon: BookOpen,
      color: 'amber',
      points: [
        {
          main: 'Reading the Cues',
          sub: [
            'Opponent\'s line of restraint',
            'Shape and tendencies of opponent\'s first line',
            'Opponent\'s midfield shape and organization'
          ]
        },
        {
          main: 'Building to Score',
          sub: [
            'Every time we have the ball, look to create scoring chances',
            'Move the ball and the opponent',
            'Risk vs Reward - learn from failures'
          ]
        },
        {
          main: 'Team Affair',
          sub: [
            'Every player has a role in build up',
            'Understand range of movement and passing',
            'Collective decision making'
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            Coaching Resources
          </h1>
          <p className="text-slate-600">Training principles, player traits, and tactical knowledge for Jaguars coaches</p>
        </div>

        <Tabs defaultValue="tactical" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="tactical">Tactical Principles</TabsTrigger>
            <TabsTrigger value="traits">Player Traits</TabsTrigger>
            <TabsTrigger value="resources">External Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="tactical" className="space-y-6">
            {tacticalPrinciples.map((principle) => {
              const Icon = principle.icon;
              return (
                <Card key={principle.category} className="border-none shadow-xl">
                  <CardHeader className={`bg-gradient-to-r from-${principle.color}-50 to-${principle.color}-100 border-b`}>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br from-${principle.color}-500 to-${principle.color}-600 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {principle.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {principle.points.map((point, idx) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className={`w-2 h-6 bg-${principle.color}-500 rounded-full`} />
                            {point.main}
                          </h3>
                          <ul className="ml-8 space-y-2">
                            {point.sub.map((item, subIdx) => (
                              <li key={subIdx} className="flex items-start gap-2 text-slate-700">
                                <span className={`text-${principle.color}-500 mt-1`}>•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="traits" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {playerTraits.positions.map((position) => (
                <Card key={position.name} className="border-none shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                    <CardTitle className="text-lg">{position.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-600" />
                        Key Traits
                      </h4>
                      <ul className="space-y-2">
                        {position.traits.map((trait, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{trait}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {position.responsibilities && (
                      <div className="grid gap-4">
                        <div className="p-4 bg-red-50 rounded-lg">
                          <h5 className="font-bold text-red-900 mb-2 text-sm">Defending Responsibilities</h5>
                          <ul className="space-y-1">
                            {position.responsibilities.defending.map((resp, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-red-800">
                                <span className="text-red-500">→</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-lg">
                          <h5 className="font-bold text-emerald-900 mb-2 text-sm">Attacking Responsibilities</h5>
                          <ul className="space-y-1">
                            {position.responsibilities.attacking.map((resp, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-emerald-800">
                                <span className="text-emerald-500">→</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <Card key={resource.id} className="border-none shadow-xl hover:shadow-2xl transition-all group">
                    <CardHeader className={`bg-gradient-to-r ${resource.color} text-white`}>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{resource.title}</CardTitle>
                          <p className="text-xs text-white/80">{resource.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full"
                      >
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Resource
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Development Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <a 
                    href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/6f73a8deb_Soccer-Blueprint-How-we-play-2023.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start h-auto p-4 hover:bg-purple-50">
                      <FileText className="w-5 h-5 mr-3 text-purple-600" />
                      <div className="text-left">
                        <div className="font-semibold">Soccer Blueprint</div>
                        <div className="text-xs text-slate-500">How We Play - Principles of Play</div>
                      </div>
                    </Button>
                  </a>
                  <a 
                    href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691b4f505049805bdf639ffd/dd7cffbe4_PDP2025.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start h-auto p-4 hover:bg-purple-50">
                      <FileText className="w-5 h-5 mr-3 text-purple-600" />
                      <div className="text-left">
                        <div className="font-semibold">Player Development Program</div>
                        <div className="text-xs text-slate-500">Complete PDP 2025</div>
                      </div>
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}