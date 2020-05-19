import React from 'react';
import { shallow } from 'enzyme';
import { ThemeProvider, StylesProvider } from '@material-ui/core/styles';
import Fullscreen from 'react-full-screen';
import { AppProviders } from '../../../src/components/AppProviders';
import settings from '../../../src/config/settings';

jest.unmock('react-i18next');

/** */
function createWrapper(props) {
  return shallow(
    <AppProviders
      language="en"
      isFullscreenEnabled={false}
      setWorkspaceFullscreen={() => {}}
      theme={settings.theme}
      translations={{}}
      t={k => k}
      {...props}
    />,
  );
}

describe('AppProviders', () => {
  it('should render all needed elements ', () => {
    const wrapper = createWrapper();
    expect(wrapper.find(ThemeProvider).length).toBe(1);
    expect(wrapper.find(StylesProvider).length).toBe(1);
    expect(wrapper.find(Fullscreen).length).toBe(1);
  });

  it('sets up a theme based on the config passed in merged w/ MaterialUI', () => {
    const wrapper = createWrapper();
    const { theme } = wrapper.find(ThemeProvider).props();
    expect(theme.palette.type).toEqual('light');
    expect(theme.typography.useNextVariants).toBe(true);
    expect(Object.keys(theme).length).toBeGreaterThan(10);
  });

  it('sets up translations based on the config passed in', () => {
    const wrapper = createWrapper({ translations: { en: { off: 'on' } } });
    expect(wrapper.instance().i18n.t('off')).toEqual('on');
  });

  it('should pass setWorkspaceFullscreen to Fullscreen.onChange', () => {
    const mockFn = jest.fn();
    const wrapper = createWrapper({ setWorkspaceFullscreen: mockFn });
    expect(wrapper.find(Fullscreen).first().prop('onChange'))
      .toBe(mockFn);
  });

  it('should pass isFullscreenEnabled to Fullscreen.enabled', () => {
    let wrapper = createWrapper({ isFullscreenEnabled: false });
    expect(wrapper.find(Fullscreen).first().prop('enabled'))
      .toEqual(false);

    wrapper = createWrapper({ isFullscreenEnabled: true });
    expect(wrapper.find(Fullscreen).first().prop('enabled'))
      .toEqual(true);
  });

  describe('componentDidUpdate()', () => {
    it('changes the i18n language if the language prop has been updated', () => {
      const wrapper = createWrapper();

      expect(wrapper.instance().i18n.language).toEqual('en');
      wrapper.setProps({ language: 'de' });
      expect(wrapper.instance().i18n.language).toEqual('de');
    });
  });
});
