// @flow

import { useContext, useEffect } from 'react';
import { RegistryContext } from './Contexts';

import type { ElementRef } from 'react';

export default function useContextMenu({
  data,
  id,
  onChange,
  ref,
}: {|
  data: Object,
  id: string,
  ref: ElementRef<HTMLElement>,
|}) {
  const { showMenu } = useContext(RegistryContext);

  useEffect(() => {
    if (ref.current !== null) {
      const handleContextMenu = event => {
        event.preventDefault();
        event.stopPropagation();

        const pageX = event.pageX || (event.touches && event.touches[0].pageX);
        const pageY = event.pageY || (event.touches && event.touches[0].pageY);

        showMenu({ data, id, onChange, pageX, pageY });
      };

      const trigger = ref.current;
      trigger.addEventListener('contextmenu', handleContextMenu);

      return () => {
        trigger.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [data, id, showMenu]);
}
