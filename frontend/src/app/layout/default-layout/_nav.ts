import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    title: true,
    name: ''
  },
  {
    name: 'الصفحة الرئيسية',
    url: '/',
    iconComponent: { name: 'cil-home' },
  },
  {
    title: true,
    name: 'منصة أكس'
  },
  {
    name: 'الأجهزة',
    url: '/devices',
    iconComponent: { name: 'cil-screen-smartphone' }
  },
  {
    name: 'الحسابات',
    url: '/accounts',
    iconComponent: { name: 'cil-user' }
  },
  {
    name: 'مكتبات التغريدات',
    url: '/tweets',
    iconComponent: { name: 'cil-library-add' }
  }
];
