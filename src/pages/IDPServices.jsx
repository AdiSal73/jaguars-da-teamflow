import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Target, Users, Calendar, CheckCircle, ArrowRight, Sparkles, Edit, Trash2, Plus } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const iconMap = {
  'Video Analysis': Video,
  'Skill Building': Target,
  'Position Training': Users,
  'Other': Target
};

export default function IDPServices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    full_description: '',
    category: 'Other',
    duration: 60,
    price: 0,
    image_url: '',
    location: '',
    benefits: [],
    color: 'from-emerald-600 to-teal-600',
    is_active: true
  });
  const [benefitInput, setBenefitInput] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const isAdmin = user?.role === 'admin';

  const { data: idpServices = [] } = useQuery({
    queryKey: ['idpServices'],
    queryFn: () => base44.entities.IDPService.filter({ is_active: true })
  });

  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.IDPService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['idpServices']);
      setShowEditDialog(false);
      resetForm();
      toast.success('Service created');
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.IDPService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['idpServices']);
      setShowEditDialog(false);
      resetForm();
      toast.success('Service updated');
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => base44.entities.IDPService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['idpServices']);
      toast.success('Service deleted');
    }
  });

  const resetForm = () => {
    setServiceForm({
      name: '',
      description: '',
      full_description: '',
      category: 'Other',
      duration: 60,
      price: 0,
      image_url: '',
      location: '',
      benefits: [],
      color: 'from-emerald-600 to-teal-600',
      is_active: true
    });
    setEditingService(null);
    setBenefitInput('');
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      full_description: service.full_description || '',
      category: service.category || 'Other',
      duration: service.duration || 60,
      price: service.price || 0,
      image_url: service.image_url || '',
      location: service.location || '',
      benefits: service.benefits || [],
      color: service.color || 'from-emerald-600 to-teal-600',
      is_active: service.is_active !== false
    });
    setShowEditDialog(true);
  };

  const handleSave = () => {
    if (!serviceForm.name || !serviceForm.description) {
      toast.error('Please fill required fields');
      return;
    }

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceForm });
    } else {
      createServiceMutation.mutate(serviceForm);
    }
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setServiceForm({
        ...serviceForm,
        benefits: [...serviceForm.benefits, benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };

  const removeBenefit = (index) => {
    setServiceForm({
      ...serviceForm,
      benefits: serviceForm.benefits.filter((_, i) => i !== index)
    });
  };

  const handleBookService = (service) => {
    navigate(`${createPageUrl('Bookingpage')}?service=${encodeURIComponent(service.name)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-sm font-medium">Individual Development Program</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Elevate Your Game
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8">
            Personalized training programs designed to unlock your full potential on the field
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">1-on-1 Coaching</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">Expert Video Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">Scenario Specific Training</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {isAdmin && (
          <div className="flex justify-end mb-6">
            <Button onClick={() => { resetForm(); setShowEditDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        )}
        
        <div className="grid md:grid-cols-3 gap-8">
          {idpServices.map((service, idx) => {
            const Icon = iconMap[service.category] || Target;
            const isSelected = selectedService?.id === service.id;
            
            return (
              <Card 
                key={service.id}
                className={`group relative overflow-hidden border-2 transition-all duration-500 cursor-pointer ${
                  isSelected ? 'border-emerald-400 shadow-2xl scale-105' : 'border-slate-700 hover:border-slate-600 hover:scale-105'
                } bg-slate-800/50 backdrop-blur-md`}
                onClick={() => setSelectedService(isSelected ? null : service)}
              >
                {isAdmin && (
                  <div className="absolute top-2 left-2 z-10 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleEdit(service); }}
                      className="h-7 px-2 bg-white/90 hover:bg-white"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this service?')) {
                          deleteServiceMutation.mutate(service.id);
                        }
                      }}
                      className="h-7 px-2 bg-white/90 hover:bg-white text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80'} 
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60`}></div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge className="bg-white/90 text-slate-900 font-bold">
                      {service.duration} min
                    </Badge>
                    {service.price > 0 && (
                      <Badge className="bg-emerald-500 text-white font-bold">
                        ${service.price}
                      </Badge>
                    )}
                  </div>
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center shadow-xl`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-white text-xl flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {service.name}
                  </CardTitle>
                  <p className="text-slate-300 text-sm mt-2">{service.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isSelected && (
                    <>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {service.full_description || service.description}
                      </p>
                      
                      {service.location && (
                        <div className="mt-2 text-sm text-slate-400">
                          📍 {service.location}
                        </div>
                      )}
                      
                      {service.benefits && service.benefits.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-slate-700">
                          <p className="text-white font-semibold text-sm">What You'll Get:</p>
                          {service.benefits.map((benefit, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300 text-xs">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookService(service);
                    }}
                    className={`w-full bg-gradient-to-r ${service.color} hover:opacity-90 text-white font-semibold mt-4`}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-br from-emerald-600 to-blue-600 border-none shadow-2xl">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Take Your Game to the Next Level?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Our IDP services are designed to give you the individual attention and specialized training you need to excel on the field.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate(createPageUrl('Bookingpage'))}
                className="bg-white text-emerald-600 hover:bg-slate-100 font-bold text-lg px-8"
              >
                View All Available Sessions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={serviceForm.category} onValueChange={v => setServiceForm({...serviceForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Video Analysis">Video Analysis</SelectItem>
                    <SelectItem value="Skill Building">Skill Building</SelectItem>
                    <SelectItem value="Position Training">Position Training</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Short Description *</Label>
              <Input value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
            </div>

            <div>
              <Label>Full Description</Label>
              <Textarea value={serviceForm.full_description} onChange={e => setServiceForm({...serviceForm, full_description: e.target.value})} rows={4} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})} />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input type="number" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})} />
              </div>
              <div>
                <Label>Color Gradient</Label>
                <Input value={serviceForm.color} onChange={e => setServiceForm({...serviceForm, color: e.target.value})} placeholder="from-purple-600 to-pink-600" />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input value={serviceForm.location} onChange={e => setServiceForm({...serviceForm, location: e.target.value})} placeholder="e.g., Zoom, CW3 Branch" />
            </div>

            <div>
              <Label>Image URL</Label>
              <Input value={serviceForm.image_url} onChange={e => setServiceForm({...serviceForm, image_url: e.target.value})} placeholder="https://..." />
            </div>

            <div>
              <Label>Benefits</Label>
              <div className="flex gap-2 mb-2">
                <Input value={benefitInput} onChange={e => setBenefitInput(e.target.value)} placeholder="Add a benefit" onKeyDown={e => e.key === 'Enter' && addBenefit()} />
                <Button onClick={addBenefit} size="sm"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-1">
                {serviceForm.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="flex-1 text-sm">{benefit}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeBenefit(i)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {editingService ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}