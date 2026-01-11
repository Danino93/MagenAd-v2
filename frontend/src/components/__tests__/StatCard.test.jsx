/*
 * StatCard Component Tests
 * ------------------------
 * בדיקות עבור StatCard
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../StatCard'
import { TrendingUp } from 'lucide-react'

describe('StatCard', () => {
  it('renders with basic props', () => {
    render(
      <StatCard
        title="Total Clicks"
        value={1234}
        icon={TrendingUp}
      />
    )
    
    expect(screen.getByText('Total Clicks')).toBeInTheDocument()
    expect(screen.getByText('1234')).toBeInTheDocument()
  })
  
  it('shows positive change with green arrow', () => {
    render(
      <StatCard
        title="Revenue"
        value={5000}
        change={15.5}
        icon={TrendingUp}
      />
    )
    
    const change = screen.getByText('15.5%')
    expect(change).toHaveClass('text-green-500')
  })
  
  it('shows negative change with red arrow', () => {
    render(
      <StatCard
        title="Revenue"
        value={5000}
        change={-10.2}
        icon={TrendingUp}
      />
    )
    
    const change = screen.getByText('10.2%')
    expect(change).toHaveClass('text-red-500')
  })
  
  it('applies correct color class', () => {
    const { container } = render(
      <StatCard
        title="Test"
        value={100}
        icon={TrendingUp}
        color="blue"
      />
    )
    
    const iconContainer = container.querySelector('.bg-blue-500')
    expect(iconContainer).toBeInTheDocument()
  })
})
