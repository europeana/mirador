import { createSelector } from 'reselect';
import compact from 'lodash/compact';
import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import AnnotationFactory from '../../lib/AnnotationFactory';
import { getCanvas, getVisibleCanvases } from './canvases';

const getAnnotationsOnCanvas = createSelector(
  [
    getCanvas,
    state => state.annotations,
  ],
  (canvas, annotations) => {
    if (!annotations || !canvas) return [];
    if (!annotations[canvas.id]) return [];

    return flatten(Object.values(annotations[canvas.id]));
  },
);

const getPresentAnnotationsCanvas = createSelector(
  [
    getAnnotationsOnCanvas,
  ],
  annotations => filter(
    Object.values(annotations)
      .map(annotation => annotation && AnnotationFactory.determineAnnotation(annotation.json)),
    annotation => annotation && annotation.present(),
  ),
);


const getAnnotationsOnSelectedCanvases = createSelector(
  [
    getVisibleCanvases,
    state => state.annotations,
  ],
  (canvases, annotations) => {
    if (!annotations || !canvases) return [];
    return flatten(
      canvases.map(c => c.id).map(
        targetId => annotations[targetId] && Object.values(annotations[targetId]),
      ),
    );
  },
);

const getPresentAnnotationsOnSelectedCanvases = createSelector(
  [
    getAnnotationsOnSelectedCanvases,
  ],
  annotations => filter(
    Object.values(annotations)
      .map(annotation => annotation && AnnotationFactory.determineAnnotation(annotation.json)),
    annotation => annotation && annotation.present(),
  ),
);

/**
* Return an array of annotation resources filtered by the given motivation for a particular canvas
* @param {Array} annotations
* @param {Array} motivations
* @return {Array}
*/
export const getAnnotationResourcesByMotivationForCanvas = createSelector(
  [
    getPresentAnnotationsCanvas,
    (state, { motivations }) => motivations,
  ],
  (annotations, motivations) => filterAnnotationResources(annotations, motivations),
);

/**
* Return an array of annotation resources filtered by the given motivation
* @param {Array} annotations
* @param {Array} motivations
* @return {Array}
*/
export const getAnnotationResourcesByMotivation = createSelector(
  [
    getPresentAnnotationsOnSelectedCanvases,
    (state, { motivations }) => motivations,
  ],
  (annotations, motivations) => filterAnnotationResources(annotations, motivations),
);

/**
* Return an array of annotation resources filtered by the given filters
* @param {Array} annotations
* @param {Object} filter
* @return {Array}
*/
const filterAnnotationResources = (annotations, filters) => filter(
  flatten(annotations.map(annotation => annotation.resources)),
  resource => Object.entries(filters).every(
    (resourceFilter) => {
      let filterProperty;
      if (resource.resource[resourceFilter[0]]) {
        filterProperty = resource.resource[resourceFilter[0]];
      } else {
        filterProperty = resource[resourceFilter[0]];
      }

      return flatten(compact(new Array(filterProperty))).some(
        propertyValue => resourceFilter[1].includes(propertyValue),
      );
    },
  ),
);

/**
 * Return the selected annotations IDs of a given CanvasId
 * @param {Object} state
 * @param {String} windowId
 * @param {Array} targetIds
 * @return {Array}
 */
export const getSelectedAnnotationIds = createSelector(
  [
    (state, { windowId }) => state.windows[windowId].selectedAnnotations,
    getVisibleCanvases,
  ],
  (selectedAnnotations, canvases) => (
    (canvases && flatten(
      canvases.map(c => c.id).map(targetId => selectedAnnotations && selectedAnnotations[targetId]),
    )) || []
  ),
);

export const getSelectedAnnotationsOnCanvases = createSelector(
  [
    getPresentAnnotationsOnSelectedCanvases,
    getSelectedAnnotationIds,
  ],
  (canvasAnnotations, selectedAnnotationIds) => canvasAnnotations.map(annotation => ({
    id: (annotation['@id'] || annotation.id),
    resources: annotation.resources.filter(
      r => selectedAnnotationIds && selectedAnnotationIds.includes(r.id),
    ),
  })).filter(val => val.resources.length > 0),
);

export const getHighlightedAnnotationsOnCanvases = createSelector(
  [
    getPresentAnnotationsOnSelectedCanvases,
    (state, { windowId }) => state.windows[windowId].highlightedAnnotation,
    (state, { windowId }) => state.windows[windowId].displayAllAnnotations,
  ],
  (canvasAnnotations, highlightedAnnotation, displayAllAnnotations) => {
    if (displayAllAnnotations) return canvasAnnotations;
    if (highlightedAnnotation) {
      return canvasAnnotations.map(annotation => ({
        id: (annotation['@id'] || annotation.id),
        resources: annotation.resources.filter(
          r => highlightedAnnotation && highlightedAnnotation === r.id,
        ),
      })).filter(val => val.resources.length > 0);
    }
    return [];
  },
);
