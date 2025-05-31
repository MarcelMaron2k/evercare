declare module "*.json" {
  const value: any;
  export default value;
}
declare module 'react-native-calendar-events' {
  const RNCalendarEvents: {
    requestPermissions(): Promise<'authorized' | 'denied'>;
    saveEvent(
      title: string,
      details: {
        startDate: string;
        endDate: string;
        location?: string;
        notes?: string;
        calendarId?: string;
        alarms?: any;
        recurrence?: any;
      }
    ): Promise<string>;
    // add any other methods you need here…
  };
  export default RNCalendarEvents;
}