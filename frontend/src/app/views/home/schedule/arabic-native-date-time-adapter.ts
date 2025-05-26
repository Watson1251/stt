import { NativeDateTimeAdapter } from '@danielmoncada/angular-datetime-picker';

export class ArabicNativeDateTimeAdapter extends NativeDateTimeAdapter {

    override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
        return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    }

    override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
        return [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
    }
}
