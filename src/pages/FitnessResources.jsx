import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Heart, TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FitnessResources() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">90Min Fitness Program</h1>
            <p className="text-slate-600">Let's get you ready to make an impact for the full 90. Get fit...Be Great!</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Evaluation</h3>
            <p className="text-sm text-slate-600">Establish fitness baseline with physical readiness assessments and create personalized plans</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Training</h3>
            <p className="text-sm text-slate-600">Adaptive training methods to plan each week based on performance and schedule</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Monitoring</h3>
            <p className="text-sm text-slate-600">Track training load, identify peak training times, monitor heart rate and sleep quality</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resources You Need
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Heart className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Smart Watch or Heart Rate Monitor</p>
              <p className="text-sm text-slate-600">Track your heart rate zones during training</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
            <Activity className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Smartphone/Watch with Strava</p>
              <p className="text-sm text-slate-600">Track workouts and upload to our team group</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <a href="https://www.strava.com/clubs/1233353" target="_blank" rel="noopener noreferrer">
                <Users className="w-4 h-4 mr-2" />
                Join Strava Group
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://adisal.com/michigan-jaguars-ga-physical-testing/" target="_blank" rel="noopener noreferrer">
                View Test Results
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            RPE Scale (Rate of Perceived Exertion)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <img 
            src="https://adisal.com/wp-content/uploads/2024/08/RPE-SCALE-CLASS.png" 
            alt="RPE Scale" 
            className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
          />
          <p className="text-sm text-slate-600 text-center mt-4">Use this scale to gauge your effort level during workouts</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
          <CardTitle>4-Week Training Program</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="week1">
              <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600">
                Week 1: Foundation Building
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Workout 1: Easy Recovery Run</h4>
                  <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                    <li>5 min warmup and stretch</li>
                    <li>40 min easy pace</li>
                    <li>10 min recovery and stretching</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-bold text-emerald-900 mb-3">Workout 2: Get After It - Threshold Setting</h4>
                  <p className="text-sm text-slate-700 mb-3">Set your threshold and zones. Start easier and push harder towards the end.</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-600">1</Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Warm up</p>
                        <p className="text-xs text-slate-600">5 min @ 1-3 RPE</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-red-600">2</Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Hard Intervals (Repeat 4x)</p>
                        <p className="text-xs text-slate-600">1 min @ 7-9 RPE, then 1 min @ 1-3 RPE easy</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-yellow-600">3</Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Recovery</p>
                        <p className="text-xs text-slate-600">5 min @ 3-5 RPE</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-orange-600">4</Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Active</p>
                        <p className="text-xs text-slate-600">30 min @ 6-8 RPE</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-slate-600">5</Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Cool Down</p>
                        <p className="text-xs text-slate-600">10 min @ 1-5 RPE</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-900">
                    💡 Tip: Use the last 20 minutes of the 30-minute effort to set your running threshold
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="week2">
              <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600">
                Week 2: Cadence & Pick-ups
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Workout 1: Easy Recovery Run</h4>
                  <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                    <li>5 min warmup and stretch</li>
                    <li>40 min easy pace</li>
                    <li>10 min recovery and stretching</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-bold text-emerald-900 mb-3">Workout 2: Cadence Pick-ups</h4>
                  <div className="space-y-3">
                    <div><span className="font-semibold">Warm up:</span> 10 min @ Zone 1-2</div>
                    <div><span className="font-semibold">10 x 20 sec Pick-ups:</span> 30 min @ Zone 5b-5c (faster than 10k pace)</div>
                    <div><span className="font-semibold">Cool Down:</span> 10 min @ Zone 1-2</div>
                  </div>
                  <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-900">
                    💡 Cadence goal: Count right foot strikes for 20 seconds. Strive for 30+
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="week3">
              <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600">
                Week 3: VO2 Max Training
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Workout 1: Easy Recovery Run</h4>
                  <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                    <li>5 min warmup and stretch</li>
                    <li>40 min easy pace</li>
                    <li>10 min recovery and stretching</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-bold text-emerald-900 mb-3">Workout 2: 200m Repeats</h4>
                  <p className="text-sm text-slate-700 mb-3">On track or GPS device on grass/soft surface</p>
                  <div className="space-y-3">
                    <div><span className="font-semibold">Warm up:</span> 20 min @ Zone 1-2</div>
                    <div><span className="font-semibold">Active:</span> 10-20 x 200m @ VO2max pace (20 sec/mile faster than 5k pace)</div>
                    <div><span className="font-semibold">Recovery:</span> Jog 100m after each 200m (same time as interval)</div>
                  </div>
                  <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-900">
                    ⚠️ Stop when you can no longer maintain targeted pace
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="week4">
              <AccordionTrigger className="text-lg font-semibold hover:text-emerald-600">
                Week 4: Fartlek Training
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Workout 1: Easy Recovery Run</h4>
                  <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                    <li>5 min warmup and stretch</li>
                    <li>40 min easy pace</li>
                    <li>10 min recovery and stretching</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-bold text-emerald-900 mb-3">Workout 2: Trail Fartlek</h4>
                  <p className="text-sm text-slate-700 mb-3">Run fast and slow as you feel. Mix all heart rate zones.</p>
                  <div className="space-y-3">
                    <div><span className="font-semibold">Warm up:</span> 10 min @ 70-80% threshold pace</div>
                    <div><span className="font-semibold">Active:</span> 30 min @ 105-115% threshold pace (vary as you feel)</div>
                    <div><span className="font-semibold">Cool Down:</span> 10 min @ 70-80% threshold pace</div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="faq1">
              <AccordionTrigger className="text-left">What is aerobic and anaerobic fitness?</AccordionTrigger>
              <AccordionContent className="text-slate-600 space-y-2">
                <p><strong>Aerobic Fitness:</strong> Your ability to jog for long periods. Soccer players cover about 7 miles in a 90-minute game, mostly through jogging.</p>
                <p><strong>Anaerobic Fitness:</strong> Your capacity to sprint, recover quickly, and sprint again during high-intensity moments.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq2">
              <AccordionTrigger className="text-left">How do I determine my anaerobic threshold and VO2 max?</AccordionTrigger>
              <AccordionContent className="text-slate-600 space-y-3">
                <div>
                  <p className="font-semibold text-slate-900 mb-1">VO2 Max</p>
                  <p className="text-sm">Shows how much oxygen your body absorbs and uses while working out.</p>
                  <p className="text-sm mt-2">Time yourself in a 2-mile run, then calculate: <a href="https://www.omnicalculator.com/sports/vo2-max-runners" target="_blank" className="text-emerald-600 underline">VO2 Max Calculator</a></p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Anaerobic Threshold</p>
                  <p className="text-sm">The point where oxygen becomes insufficient and your body switches to burning glucose (producing lactic acid).</p>
                  <p className="text-sm mt-2 font-mono bg-slate-100 p-2 rounded">Max BPM = 208 - (0.7 × age)</p>
                  <p className="text-xs mt-2">Heart Rate Zones:</p>
                  <ul className="text-xs ml-4 mt-1 space-y-1">
                    <li>Recovery: 50-60%</li>
                    <li>Endurance: 60-70%</li>
                    <li>Aerobic: 70-80%</li>
                    <li><strong>Anaerobic: 80-90%</strong></li>
                    <li>VO2 Max: up to 100%</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq3">
              <AccordionTrigger className="text-left">What is HIIT training?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                <p><strong>High-Intensity Interval Training (HIIT)</strong> involves repeated, extremely hard bouts of work interspersed with recovery periods. Typically means pushing your heart rate above 75% of maximum, recovering, and repeating.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq4">
              <AccordionTrigger className="text-left">Why do we post our workouts?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                <p>Our culture is based on <strong>transparency and accountability</strong>. Posting workouts helps us:</p>
                <ul className="ml-4 mt-2 space-y-1 list-disc text-sm">
                  <li>Inspire teammates</li>
                  <li>Track our progress</li>
                  <li>Build team camaraderie</li>
                </ul>
                <p className="text-sm mt-3">Our Strava group is private. If you prefer not to post publicly, send workout data directly to your coach.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq5">
              <AccordionTrigger className="text-left">Is this program mandatory?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                <p>This program is <strong>optional</strong>, but your fitness level will determine your ability to:</p>
                <ul className="ml-4 mt-2 space-y-1 list-disc text-sm">
                  <li>Play more impactful minutes</li>
                  <li>Help your team throughout the full 90 minutes</li>
                  <li>Reach peak performance sooner</li>
                  <li>Stay healthy during the season</li>
                </ul>
                <p className="text-sm mt-3 italic">Starting the season with a good base makes everything easier.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}