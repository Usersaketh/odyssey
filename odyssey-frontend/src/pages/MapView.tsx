import React, { useEffect, useRef, useState } from 'react';
import { JournalEntry } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { useJournal } from '@/contexts/JournalContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InteractiveMap from '@/components/map/InteractiveMap';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

// Fix Leaflet marker icons (Next.js workaround)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapViewPage = () => {
  const { journals, isLoading } = useJournal();
  const { isAuthenticated, user } = useAuth();
  const [showOnlyMyJournals, setShowOnlyMyJournals] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  
  // When unauthenticated we show an empty map (no markers). If authenticated, apply filters.
  let filteredJournals = [] as JournalEntry[];
  if (isAuthenticated) {
    filteredJournals = showOnlyMyJournals
      ? journals.filter(journal => journal.userId === user?.id)
      : journals.filter(journal => journal.isPublic);
  }

  const selectNextJournal = () => {
    if (!selectedJournal) return;
    const currentIndex = filteredJournals.findIndex(j => j.id === selectedJournal.id);
    const nextIndex = (currentIndex + 1) % filteredJournals.length;
    setSelectedJournal(filteredJournals[nextIndex]);
  };

  const selectPrevJournal = () => {
    if (!selectedJournal) return;
    const currentIndex = filteredJournals.findIndex(j => j.id === selectedJournal.id);
    const prevIndex = (currentIndex - 1 + filteredJournals.length) % filteredJournals.length;
    setSelectedJournal(filteredJournals[prevIndex]);
  };
    
  return (
    <>
      <Navbar />
      <main className="container py-6 sm:py-12 px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Travel Map</h1>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base">
            Explore travel journals visually through our interactive map. Click on markers to view journal details.
          </p>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Switch
              id="show-only-my-journals"
              checked={showOnlyMyJournals}
              onCheckedChange={setShowOnlyMyJournals}
            />
            <Label htmlFor="show-only-my-journals" className="text-sm">Show private also</Label>
          </div>
        )}
        {!isAuthenticated && (
          <div className="mb-4">
            <div className="rounded-md border bg-muted p-4 text-center">
              <h3 className="font-semibold mb-2">Please log in to view travel locations</h3>
              <p className="text-sm text-muted-foreground mb-3">For privacy reasons, location markers are only visible to signed-in users.</p>
              <div className="flex justify-center gap-2">
                <Link to="/login">
                  <Button>Log in</Button>
                </Link>
                <Link to="/explore">
                  <Button variant="ghost">Browse Explore</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="w-full">
              <div className="aspect-[3/2] sm:aspect-[2/1] rounded-lg overflow-hidden border relative">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <InteractiveMap 
                    journals={filteredJournals} 
                    onJournalSelect={setSelectedJournal}
                    selectedJournal={selectedJournal}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              {selectedJournal ? (
                <Card className="bg-card/95 shadow-lg backdrop-blur-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-base sm:text-lg line-clamp-1">{selectedJournal.title}</h3>
                      <div className="flex space-x-1">
                        <Button size="icon" variant="ghost" onClick={selectPrevJournal} className="h-8 w-8">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={selectNextJournal} className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedJournal.images && selectedJournal.images.length > 0 && (
                      <div className="mb-2 h-32 sm:h-48 rounded-md overflow-hidden">
                        <img
                          src={selectedJournal.images[0]}
                          alt={selectedJournal.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-muted-foreground mb-1 gap-1 sm:gap-0">
                      <span className="truncate">{selectedJournal.location?.name}</span>
                      <span className="text-xs">{new Date(selectedJournal.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs sm:text-sm line-clamp-3 mb-4">{selectedJournal.content}</p>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild className="flex-1 text-xs sm:text-sm">
                        <a href={`/journals/${selectedJournal.id}`}>View Journal</a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedJournal(null)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card/95 shadow-lg backdrop-blur-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="mb-4">
                      <h3 className="font-bold text-base sm:text-lg mb-2">Journals</h3>
                      <div className="space-y-2 max-h-60 sm:max-h-[calc(100vh-12rem)] overflow-y-auto">
                        {filteredJournals.map((journal) => (
                          <div
                            key={journal.id}
                            onClick={() => setSelectedJournal(journal)}
                            className="p-2 sm:p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              {journal.images && journal.images.length > 0 && (
                                <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                                  <img
                                    src={journal.images[0]}
                                    alt={journal.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium line-clamp-1">{journal.title}</h4>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="line-clamp-1">{journal.location?.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(journal.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MapViewPage;
