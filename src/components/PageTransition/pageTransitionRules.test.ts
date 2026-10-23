import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pageTransition } from './pageTransitionRules';

describe('pageTransition', () => {
  it('goes inward from search results to an archive page', () => {
    assert.equal(pageTransition('search', 'saksmappe'), 'inward');
    assert.equal(pageTransition('enhet', 'moetemappe'), 'inward');
    assert.equal(pageTransition('home', 'saksmappe'), 'inward');
  });

  it('goes outward from an archive page back to search results', () => {
    assert.equal(pageTransition('saksmappe', 'search'), 'outward');
    assert.equal(pageTransition('moetemappe', 'enhet'), 'outward');
    assert.equal(pageTransition('saksmappe', 'home'), 'outward');
  });

  it('fades between two archive pages', () => {
    assert.equal(pageTransition('saksmappe', 'moetemappe'), 'fade');
    assert.equal(pageTransition('moetemappe', 'saksmappe'), 'fade');
  });

  it('fades to and from the static pages, archive pages included', () => {
    assert.equal(pageTransition('search', 'about'), 'fade');
    assert.equal(pageTransition('about', 'home'), 'fade');
    assert.equal(pageTransition('about', 'privacy'), 'fade');
    assert.equal(pageTransition('bruker', 'privacy'), 'fade');
    assert.equal(pageTransition('about', 'saksmappe'), 'fade');
    assert.equal(pageTransition('moetemappe', 'privacy'), 'fade');
  });

  it('leaves the results list and unlisted moves alone', () => {
    assert.equal(pageTransition('home', 'search'), null);
    assert.equal(pageTransition('search', 'enhet'), null);
    assert.equal(pageTransition('search', 'admin'), null);
  });

  it('never animates a move within one section', () => {
    assert.equal(pageTransition('about', 'about'), null);
    assert.equal(pageTransition('saksmappe', 'saksmappe'), null);
  });
});
