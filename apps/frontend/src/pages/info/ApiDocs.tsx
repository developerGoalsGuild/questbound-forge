/**
 * API Documentation Page
 * 
 * Comprehensive API documentation with endpoint listings, examples, and interactive features.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, Copy, Check, Code, Shield, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiEndpoints } from '@/data/api/endpoints';

const ApiDocs: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  
  const apiDocsTranslations = (t as any)?.apiDocs || {};
  const commonTranslations = (t as any)?.common || {};

  const filteredEndpoints = useMemo(() => {
    if (!searchQuery) return apiEndpoints;
    const query = searchQuery.toLowerCase();
    return apiEndpoints.map(category => ({
      ...category,
      endpoints: category.endpoints.filter(endpoint =>
        endpoint.path.toLowerCase().includes(query) ||
        endpoint.method.toLowerCase().includes(query) ||
        endpoint.description.toLowerCase().includes(query) ||
        endpoint.category.toLowerCase().includes(query)
      )
    })).filter(category => category.endpoints.length > 0);
  }, [searchQuery]);

  const handleCopyCode = (code: string, endpointId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedEndpoint(endpointId);
    toast({
      title: apiDocsTranslations?.copied || 'Copied!',
      description: apiDocsTranslations?.copiedDescription || 'Code example copied to clipboard',
    });
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Code className="h-8 w-8" />
              {apiDocsTranslations?.title || 'API Documentation'}
            </h1>
            <p className="text-muted-foreground">
              {apiDocsTranslations?.subtitle || 'Complete API reference for GoalsGuild'}
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={apiDocsTranslations?.searchPlaceholder || 'Search endpoints...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Authentication Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {apiDocsTranslations?.authentication?.title || 'Authentication'}
            </CardTitle>
            <CardDescription>
              {apiDocsTranslations?.authentication?.description || 'All API requests require authentication'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {apiDocsTranslations?.authentication?.headers?.title || 'Required Headers'}
              </h3>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <div>Authorization: Bearer {'{token}'}</div>
                <div>x-api-key: {'{api_key}'}</div>
                <div>Content-Type: application/json</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {apiDocsTranslations?.authentication?.gettingToken?.title || 'Getting an Access Token'}
              </h3>
              <p className="text-muted-foreground">
                {apiDocsTranslations?.authentication?.gettingToken?.description || 
                 'Authenticate using the login endpoint to receive an access token. Include this token in the Authorization header for all subsequent requests.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints by Category */}
        <div className="space-y-6">
          {filteredEndpoints.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.endpoints.map((endpoint) => {
                  const endpointId = `${endpoint.method}-${endpoint.path}`;
                  const exampleCode = `curl -X ${endpoint.method} \\
  "${endpoint.baseUrl || 'https://api.goalsguild.com/v1'}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "x-api-key: YOUR_API_KEY" \\
  ${endpoint.method !== 'GET' ? `-H "Content-Type: application/json" \\\n  -d '${JSON.stringify(endpoint.exampleRequest || {}, null, 2)}'` : ''}`;

                  return (
                    <div key={endpointId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(exampleCode, endpointId)}
                          className="flex items-center gap-2"
                        >
                          {copiedEndpoint === endpointId ? (
                            <>
                              <Check className="h-4 w-4" />
                              {apiDocsTranslations?.copied || 'Copied'}
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              {apiDocsTranslations?.copy || 'Copy'}
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {endpoint.description}
                      </p>

                      {endpoint.requiresAuth !== false && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {apiDocsTranslations?.requiresAuth || 'Requires Authentication'}
                        </Badge>
                      )}

                      <Tabs defaultValue="example" className="mt-4">
                        <TabsList>
                          <TabsTrigger value="example">
                            {apiDocsTranslations?.example || 'Example'}
                          </TabsTrigger>
                          {endpoint.exampleRequest && (
                            <TabsTrigger value="request">
                              {apiDocsTranslations?.request || 'Request'}
                            </TabsTrigger>
                          )}
                          {endpoint.exampleResponse && (
                            <TabsTrigger value="response">
                              {apiDocsTranslations?.response || 'Response'}
                            </TabsTrigger>
                          )}
                        </TabsList>
                        <TabsContent value="example" className="mt-4">
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                            <code>{exampleCode}</code>
                          </pre>
                        </TabsContent>
                        {endpoint.exampleRequest && (
                          <TabsContent value="request" className="mt-4">
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                              <code>{JSON.stringify(endpoint.exampleRequest, null, 2)}</code>
                            </pre>
                          </TabsContent>
                        )}
                        {endpoint.exampleResponse && (
                          <TabsContent value="response" className="mt-4">
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                              <code>{JSON.stringify(endpoint.exampleResponse, null, 2)}</code>
                            </pre>
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Base URL Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {apiDocsTranslations?.baseUrl?.title || 'Base URL'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm font-mono bg-muted px-4 py-2 rounded block">
              {apiDocsTranslations?.baseUrl?.value || 'https://api.goalsguild.com/v1'}
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              {apiDocsTranslations?.baseUrl?.description || 
               'All API endpoints are relative to this base URL. Include the full path in your requests.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiDocs;

