"use client";

import React, { useEffect, useRef } from 'react';

interface HealthChartProps {
  data: number[];
  labels: string[];
  color: string;
  goal?: number;
}

const HealthChart: React.FC<HealthChartProps> = ({ data, labels, color, goal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find max value for scaling
    let maxValue = Math.max(...data);
    if (goal && goal > maxValue) {
      maxValue = goal;
    }
    // Add 10% headroom
    maxValue = maxValue * 1.1;

    // Draw goal line if provided
    if (goal) {
      const goalY = height - padding - (chartHeight * goal) / maxValue;
      context.beginPath();
      context.setLineDash([5, 5]);
      context.strokeStyle = '#94A3B8'; // slate-400
      context.lineWidth = 1;
      context.moveTo(padding, goalY);
      context.lineTo(width - padding, goalY);
      context.stroke();
      context.setLineDash([]);

      // Draw goal label
      context.fillStyle = '#94A3B8';
      context.font = '12px sans-serif';
      context.fillText(`Goal: ${goal}`, padding, goalY - 5);
    }

    // Draw axes
    context.beginPath();
    context.strokeStyle = '#E2E8F0'; // slate-200
    context.lineWidth = 1;
    
    // X-axis
    context.moveTo(padding, height - padding);
    context.lineTo(width - padding, height - padding);
    
    // Y-axis
    context.moveTo(padding, padding);
    context.lineTo(padding, height - padding);
    
    context.stroke();

    // Draw data bars
    const barWidth = chartWidth / data.length - 10;
    
    data.forEach((value, index) => {
      const barHeight = (chartHeight * value) / maxValue;
      const x = padding + index * (chartWidth / data.length) + 5;
      const y = height - padding - barHeight;
      
      // Draw bar
      context.beginPath();
      context.fillStyle = color;
      context.roundRect(x, y, barWidth, barHeight, 4);
      context.fill();
      
      // Draw label
      context.fillStyle = '#64748B'; // slate-500
      context.font = '12px sans-serif';
      context.textAlign = 'center';
      context.fillText(labels[index], x + barWidth / 2, height - padding + 20);
      
      // Draw value
      context.fillStyle = '#334155'; // slate-700
      context.fillText(value.toString(), x + barWidth / 2, y - 10);
    });

  }, [data, labels, color, goal]);

  return (
    <canvas 
      ref={canvasRef} 
      width={500} 
      height={300} 
      className="w-full h-full"
    />
  );
};

export default HealthChart; 