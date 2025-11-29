/**
 * Heatmap Overlay Component
 * Shows competition density as a heatmap overlay on the map
 * Red = High competition (avoid), Green = Low competition (opportunity)
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Generate heatmap data points based on competitors and landmarks
 * Creates a grid of points with intensity values
 */
function generateHeatmapGrid(center, competitors, landmarks, radius = 2500) {
  const gridSize = 20; // Number of grid cells in each direction
  const cellSize = (radius * 2) / gridSize;
  const points = [];
  
  // Convert radius from meters to degrees (approximate)
  const latDelta = radius / 111000; // 1 degree lat ≈ 111km
  const lngDelta = radius / (111000 * Math.cos(center.lat * Math.PI / 180));
  
  // Create grid
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = center.lat - latDelta + (i / gridSize) * 2 * latDelta;
      const lng = center.lng - lngDelta + (j / gridSize) * 2 * lngDelta;
      
      // Calculate competition intensity at this point
      let competitorScore = 0;
      let landmarkScore = 0;
      
      // Higher score = more competitors nearby = RED
      competitors.forEach(comp => {
        if (comp.lat && comp.lng) {
          const dist = getDistance(lat, lng, comp.lat, comp.lng);
          if (dist < cellSize * 2) {
            competitorScore += Math.max(0, 1 - dist / (cellSize * 2));
          }
        }
      });
      
      // Landmarks add opportunity (reduce competition effect slightly)
      landmarks.forEach(lm => {
        if (lm.lat && lm.lng) {
          const dist = getDistance(lat, lng, lm.lat, lm.lng);
          if (dist < cellSize * 2) {
            landmarkScore += Math.max(0, 0.3 * (1 - dist / (cellSize * 2)));
          }
        }
      });
      
      // Net intensity: positive = competition (red), negative = opportunity (green)
      // Normalize to 0-1 range
      const intensity = Math.min(1, Math.max(0, competitorScore - landmarkScore * 0.5));
      
      points.push({
        lat,
        lng,
        intensity,
        hasCompetitors: competitorScore > 0,
      });
    }
  }
  
  return points;
}

/**
 * Calculate distance between two points in meters
 */
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get color based on intensity
 * Low intensity (0) = Green (opportunity)
 * High intensity (1) = Red (competition)
 */
function getHeatColor(intensity) {
  // Color gradient: Green -> Yellow -> Orange -> Red
  if (intensity < 0.25) {
    // Green to light green
    const t = intensity / 0.25;
    return {
      r: Math.round(34 + t * 100),
      g: Math.round(197 - t * 50),
      b: Math.round(94 - t * 50),
      a: 0.3 + t * 0.1
    };
  } else if (intensity < 0.5) {
    // Light green to yellow
    const t = (intensity - 0.25) / 0.25;
    return {
      r: Math.round(134 + t * 121),
      g: Math.round(147 + t * 53),
      b: Math.round(44 - t * 44),
      a: 0.4 + t * 0.1
    };
  } else if (intensity < 0.75) {
    // Yellow to orange
    const t = (intensity - 0.5) / 0.25;
    return {
      r: 255,
      g: Math.round(200 - t * 100),
      b: 0,
      a: 0.5 + t * 0.1
    };
  } else {
    // Orange to red
    const t = (intensity - 0.75) / 0.25;
    return {
      r: 255,
      g: Math.round(100 - t * 60),
      b: Math.round(t * 50),
      a: 0.6 + t * 0.15
    };
  }
}

export default function HeatmapOverlay({ 
  center, 
  competitors = [], 
  landmarks = [],
  radius = 2500,
  enabled = true 
}) {
  const map = useMap();
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!enabled || !center || !map) return;

    // Remove existing overlay
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }

    // Generate heatmap points
    const points = generateHeatmapGrid(center, competitors, landmarks, radius);
    
    // If no competitors, don't show heatmap
    if (competitors.length === 0) return;

    // Calculate bounds
    const latDelta = radius / 111000;
    const lngDelta = radius / (111000 * Math.cos(center.lat * Math.PI / 180));
    const bounds = L.latLngBounds(
      [center.lat - latDelta, center.lng - lngDelta],
      [center.lat + latDelta, center.lng + lngDelta]
    );

    // Create canvas with higher resolution for smoother circle
    const canvas = document.createElement('canvas');
    const canvasSize = 400;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    // Define circular clipping region first
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const circleRadius = canvasSize / 2 - 2; // Slightly smaller for clean edge

    // Create circular clip path
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.clip();

    // Draw heatmap cells within the circle
    const gridSize = 20;
    const cellWidth = canvasSize / gridSize;
    const cellHeight = canvasSize / gridSize;

    points.forEach((point, index) => {
      const i = Math.floor(index / gridSize);
      const j = index % gridSize;
      
      const x = j * cellWidth + cellWidth / 2;
      const y = (gridSize - 1 - i) * cellHeight + cellHeight / 2;
      
      // Check if point is within circle
      const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (distFromCenter > circleRadius) return;
      
      const color = getHeatColor(point.intensity);
      const cellRadius = cellWidth * 1.0;
      
      // Create radial gradient for smooth effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, cellRadius);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, cellRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Restore context (removes clip)
    ctx.restore();

    // Draw circle border
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Create image overlay
    const imageUrl = canvas.toDataURL();
    overlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.7,
      interactive: false,
    });
    
    overlayRef.current.addTo(map);

    // Cleanup
    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
      }
    };
  }, [map, center, competitors, landmarks, radius, enabled]);

  return null;
}
