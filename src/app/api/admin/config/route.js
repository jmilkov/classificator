import { NextResponse } from 'next/server';
import { config } from '@/config/index';

export async function GET() {
  return NextResponse.json(config);
}

export async function POST(req) {
  try {
    const newConfig = await req.json();
    // Implementation: Update logic for configuration management
    // For this prototype, we log the update and simulate success
    console.log('Updating config:', newConfig);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update config' }, { status: 500 });
  }
}
