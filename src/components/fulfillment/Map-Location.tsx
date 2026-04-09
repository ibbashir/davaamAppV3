"use client"

import { useState, useCallback } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { IconMapPin, IconBuilding } from "@tabler/icons-react"

const containerStyle = {
    width: "100%",
    height: "400px",
}

const center = {
    lat: 30.900608,
    lng: 75.001357,
}

interface MachineData {
    lat: number
    lng: number
    machine_name: string
    machine_code: string
    _id?: string
}

interface MapLocationProps {
    machineData: MachineData[]
}

const MapLocation = ({ machineData = [] }: MapLocationProps) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    })

    const [_map, setMap] = useState<google.maps.Map | null>(null)
    const [activeMarker, setActiveMarker] = useState<number | null>(null)

    const validMachineData = machineData.filter(
        (location: MachineData) => location.lat && location.lng && !isNaN(location.lat) && !isNaN(location.lng),
    )

    const onLoad = useCallback(
        (map: google.maps.Map) => {
            const validData = machineData.filter(
                (loc: MachineData) => loc.lat && loc.lng && !isNaN(loc.lat) && !isNaN(loc.lng),
            )

            if (validData.length > 1) {
                const bounds = new window.google.maps.LatLngBounds()
                validData.forEach((loc: MachineData) => bounds.extend({ lat: loc.lat, lng: loc.lng }))
                map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 })
            } else if (validData.length === 1) {
                map.setCenter({ lat: validData[0].lat, lng: validData[0].lng })
                map.setZoom(10)
            } else {
                map.setCenter(center)
                map.setZoom(5)
            }

            setMap(map)
        },
        [machineData],
    )

    const onUnmount = useCallback(() => {
        setMap(null)
    }, [])

    const handleMarkerClick = (index: number) => {
        setActiveMarker(index)
    }

    const handleInfoWindowClose = () => {
        setActiveMarker(null)
    }

    if (!isLoaded) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconMapPin className="h-5 w-5" />
                        Machine Locations
                    </CardTitle>
                    <CardDescription>Interactive map showing all machine locations</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="w-full h-[400px] rounded-lg" />
                    <div className="flex items-center justify-center mt-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                            Loading map...
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <IconMapPin className="h-5 w-5 text-teal-600" />
                            Machine Locations
                        </CardTitle>
                        <CardDescription>Interactive map showing all machine locations</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <IconBuilding className="h-3 w-3" />
                            {validMachineData.length} Locations
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg overflow-hidden border">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={5}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={{
                            styles: [
                                {
                                    featureType: "poi",
                                    elementType: "labels",
                                    stylers: [{ visibility: "off" }],
                                },
                            ],
                        }}
                    >
                        {validMachineData.map((location: MachineData, index: number) => (
                            <Marker
                                key={index}
                                position={{ lat: location.lat, lng: location.lng }}
                                onClick={() => handleMarkerClick(index)}
                                icon={{
                                    url:
                                        "data:image/svg+xml;charset=UTF-8," +
                                        encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0d9488" stroke="#ffffff" strokeWidth="2"/>
                      <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
                    </svg>
                  `),
                                    scaledSize: new window.google.maps.Size(32, 32),
                                    anchor: new window.google.maps.Point(16, 32),
                                }}
                            >
                                {activeMarker === index && (
                                    <InfoWindow onCloseClick={handleInfoWindowClose}>
                                        <div className="p-2 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <IconMapPin className="h-4 w-4 text-teal-600" />
                                                <h4 className="font-semibold text-sm">{location.machine_name || "Location"}</h4>
                                            </div>
                                            {location.machine_code && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {location.machine_code}
                                                </Badge>
                                            )}
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        ))}
                    </GoogleMap>
                </div>

                {validMachineData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <IconMapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>No valid location data available to display on the map.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default MapLocation
