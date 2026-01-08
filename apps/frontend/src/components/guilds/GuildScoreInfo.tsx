/**
 * GuildScoreInfo Component
 * 
 * An information icon with tooltip/modal explaining how guild scores are calculated.
 * Includes full localization support for English, Spanish, and French.
 */

import React, { useState } from 'react';
import { Info, Calculator, TrendingUp, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';

interface GuildScoreInfoProps {
  variant?: 'icon' | 'button' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GuildScoreInfo: React.FC<GuildScoreInfoProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  
  // Get guild translations
  const guildTranslations = (t as any)?.guild;
  const scoreInfo = guildTranslations?.rankings?.scoreInfo;

  if (!scoreInfo) {
    console.warn('Guild score info translations not found');
    return null;
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'default';
    }
  };

  const renderTrigger = () => {
    switch (variant) {
      case 'button':
        return (
          <Button
            variant="outline"
            size={getButtonSize()}
            className={`flex items-center gap-2 ${className}`}
            onClick={() => setIsOpen(true)}
          >
            <Info className={getIconSize()} />
            {scoreInfo.title}
          </Button>
        );
      
      case 'inline':
        return (
          <span
            className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer ${className}`}
            onClick={() => setIsOpen(true)}
          >
            <Info className={getIconSize()} />
            <span className="text-sm font-medium">{scoreInfo.title}</span>
          </span>
        );
      
      default: // 'icon'
        return (
          <Button
            variant="ghost"
            size="sm"
            className={`p-1 hover:bg-blue-50 ${className}`}
            onClick={() => setIsOpen(true)}
          >
            <Info className={`${getIconSize()} text-blue-600 hover:text-blue-700`} />
          </Button>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            {scoreInfo.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Description */}
          <p className="text-gray-600 leading-relaxed">
            {scoreInfo.description}
          </p>

          {/* Formula Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-green-600" />
                Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
                  {scoreInfo.formula.activityScore}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-mono text-sm bg-green-50 px-2 py-1 rounded">
                  {scoreInfo.formula.growthBonus}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4 text-purple-600" />
                <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded font-semibold">
                  {scoreInfo.formula.totalScore}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Examples Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                {scoreInfo.examples.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">New</Badge>
                    <span className="text-sm font-medium">New Guild</span>
                  </div>
                  <p className="text-sm text-gray-700">{scoreInfo.examples.newGuild}</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">Established</Badge>
                    <span className="text-sm font-medium">Established Guild</span>
                  </div>
                  <p className="text-sm text-gray-700">{scoreInfo.examples.establishedGuild}</p>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="default" className="text-xs bg-yellow-500">Top</Badge>
                    <span className="text-sm font-medium">Top Guild</span>
                  </div>
                  <p className="text-sm text-gray-700">{scoreInfo.examples.topGuild}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                {scoreInfo.tips.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">{scoreInfo.tips.memberGrowth}</p>
                <p className="text-sm text-gray-700">{scoreInfo.tips.newGuildBoost}</p>
                <p className="text-sm text-gray-700">{scoreInfo.tips.activityMatters}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuildScoreInfo;




