import { NextResponse } from 'next/server'
import  prisma  from '@/lib/prisma'

export async function GET() {
  try {
    // Check if walk-in customer already exists
    const existingWalkIn = await prisma.customer.findFirst({
      where: {
        name: 'Walk-in Customer',
        phone: '0000000000'
      }
    })

    // If exists, return it
    if (existingWalkIn) {
      return NextResponse.json({ 
        success: true, 
        message: 'Walk-in customer already exists',
        customer: existingWalkIn 
      })
    }

    // If not exists, create it
    const walkInCustomer = await prisma.customer.create({
      data: {
        name: 'Walk-in Customer',
        phone: '0000000000',
        status: 'ACTIVE'
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Walk-in customer created successfully',
      customer: walkInCustomer 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}