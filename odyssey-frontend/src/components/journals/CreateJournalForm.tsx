import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useJournal } from '@/contexts/JournalContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/shared/Icons';
import { MapPin, X, ImagePlus, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Location } from '@/types';
import { journalApi } from '@/services/api';
import { getCoordinatesFromPlaceName, getLocationSuggestions, debounce } from '@/utils/geocoding';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(100),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }),
  isPublic: z.boolean().default(true),
  location: z.object({
    name: z.string().min(1, { message: 'Location name is required' }),
    latitude: z.number(),
    longitude: z.number(),
    placeName: z.string().optional(),
    country: z.string().optional().nullable().default(null),
    city: z.string().optional().nullable().default(null),
  }).optional(),  
  images: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

const MIN_SEARCH_LENGTH = 3; // Minimum characters before searching

const CreateJournalForm = () => {
  const { createJournal } = useJournal();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      isPublic: false,
      images: [],
    },
    shouldUnregister: true,
  });
  
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const handleLocationSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < MIN_SEARCH_LENGTH) {
        setLocationSuggestions([]);
        return;
      }

      setLocationQuery(query);
      setIsSearchingLocation(true);
      
      try {
        // Use the proper autocomplete function
        const suggestions = await getLocationSuggestions(query);
        if (suggestions && suggestions.length > 0) {
          // Convert suggestions to the Location interface format
          const locations: Location[] = suggestions.map(suggestion => ({
            name: suggestion.name,
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            placeName: suggestion.placeName,
            country: suggestion.country,
            city: suggestion.city
          }));
          setLocationSuggestions(locations);
        } else {
          // If no suggestions found, clear the list
          setLocationSuggestions([]);
        }
      } catch (error) {
        console.error('Error searching for locations:', error);
        setLocationSuggestions([]);
        toast({
          variant: "destructive",
          description: 'Location search temporarily unavailable. Please try again.',
        });
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500),
    [toast]
  );

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.name);
    form.setValue('location', loc);
    setLocationSuggestions([]);
  };

  const handleBack = () => {
    // Clear location state when going back
    setLocationQuery('');
    setSelectedLocation(null);
    setLocationSuggestions([]);
    form.setValue('location', undefined);
    navigate(-1);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    const newImages: string[] = [];
    newFiles.forEach(file => {
      const imageUrl = URL.createObjectURL(file);
      newImages.push(imageUrl);
    });
    
    const updatedImages = [...uploadedImages, ...newImages];
    setUploadedImages(updatedImages);
    form.setValue('images', updatedImages);
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    const updatedFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
    setUploadedFiles(updatedFiles);
    form.setValue('images', updatedImages);
  };

  async function onSubmit(data: FormData) {
    try {
      setIsSubmitting(true);
      
      let imageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        imageUrls = await journalApi.uploadImages(uploadedFiles);
      }
      
      const journalLocation: Location = selectedLocation || {
        name: 'Unknown location',
        latitude: 0,
        longitude: 0,
      };
      
      await createJournal({
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        location: journalLocation,
        images: imageUrls, 
      });
      
      navigate('/journals');
    } catch (error) {
      console.error('Failed to create journal', error);
      toast({
        variant: "destructive",
        description: 'Failed to create journal',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter journal title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your journal entry..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Journal</FormLabel>
                    <FormDescription>
                      Make this journal visible to other users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <div className="grid gap-3 relative">
                    <div className="relative">
                      <Input
                        placeholder="Enter a location..."
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          handleLocationSearch(e.target.value);
                        }}
                        disabled={isSubmitting || !!selectedLocation}
                      />
                      {(isSearchingLocation || isGeocoding) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {locationQuery && !selectedLocation && locationQuery.length >= MIN_SEARCH_LENGTH && (
                      <Card className="absolute z-50 top-[100%] left-0 w-full mt-1 max-h-[200px] overflow-auto shadow-lg border rounded-md bg-background">
                        <CardContent className="p-2">
                          {locationSuggestions.length > 0 ? (
                            <ul className="space-y-1">
                              {locationSuggestions.map((loc, index) => (
                                <li
                                  key={index}
                                  className="p-2 hover:bg-accent rounded-md cursor-pointer"
                                  onClick={() => handleLocationSelect(loc)}
                                >
                                  {loc.name}
                                </li>
                              ))}
                            </ul>
                          ) : isSearchingLocation ? (
                            <div className="p-2 text-muted-foreground">
                              Searching...
                            </div>
                          ) : (
                            <div className="p-2 text-muted-foreground">
                              No locations found
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {selectedLocation && (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-accent/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLocation.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(null);
                            setLocationQuery('');
                            form.setValue('location', undefined);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem className="space-y-3">
              <FormLabel>Images</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isSubmitting}
                  />
                  <div className="text-center p-4">
                    <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add Images</span>
                  </div>
                </label>
              </div>
              <FormDescription>
                Upload images from your travel experience
              </FormDescription>
            </FormItem>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating Journal...
                </>
              ) : (
                'Create Journal'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateJournalForm;
