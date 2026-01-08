/**
 * Careers Page
 * 
 * Displays job listings with filtering and application links.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, MapPin, Briefcase, Clock, DollarSign } from 'lucide-react';
import { jobs } from '@/data/careers/jobs';

const Careers: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const careersTranslations = (t as any)?.careers || {};
  const commonTranslations = (t as any)?.common || {};

  const departments = Array.from(new Set(jobs.map(job => job.department)));
  const types = ['full-time', 'part-time', 'contract', 'internship'];

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query)
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(job => job.department === selectedDepartment);
    }

    if (selectedType) {
      filtered = filtered.filter(job => job.type === selectedType);
    }

    return filtered.sort((a, b) => 
      new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    );
  }, [searchQuery, selectedDepartment, selectedType]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonTranslations?.back || 'Back'}
          </Button>
          <div className="space-y-1 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {careersTranslations?.title || 'Careers'}
            </h1>
            <p className="text-muted-foreground">
              {careersTranslations?.subtitle || 'Join our team and help people achieve their goals'}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={careersTranslations?.searchPlaceholder || 'Search jobs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDepartment === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDepartment(null)}
              >
                {careersTranslations?.allDepartments || 'All Departments'}
              </Button>
              {departments.map((dept) => (
                <Button
                  key={dept}
                  variant={selectedDepartment === dept ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDepartment(dept)}
                >
                  {dept}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                {careersTranslations?.allTypes || 'All Types'}
              </Button>
              {types.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {careersTranslations?.openPositions || 'Open Positions'}
          </h2>
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {careersTranslations?.noJobs || 'No jobs found'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/careers/apply/${job.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mb-4">
                          {job.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.department}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {job.type.charAt(0).toUpperCase() + job.type.slice(1).replace('-', ' ')}
                          </Badge>
                          {job.salary && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {job.salary}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/careers/apply/${job.id}`);
                        }}
                      >
                        {careersTranslations?.apply || 'Apply'}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Careers;

