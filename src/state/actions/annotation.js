import fetch from 'isomorphic-unfetch';
import uniq from 'lodash/uniq';
import ActionTypes from './action-types';

/**
 * requestAnnotation - action creator
 *
 * @param  {String} targetId
 * @param  {String} annotationId
 * @memberof ActionCreators
 */
export function requestAnnotation(targetId, annotationId) {
  return {
    annotationId,
    targetId,
    type: ActionTypes.REQUEST_ANNOTATION,
  };
}

/**
 * receiveAnnotation - action creator
 *
 * @param  {String} targetId
 * @param  {String} annotationId
 * @param  {Object} annotationJson
 * @memberof ActionCreators
 */
export function receiveAnnotation(targetId, annotationId, annotationJson) {
  return {
    annotationId,
    annotationJson,
    targetId,
    type: ActionTypes.RECEIVE_ANNOTATION,
  };
}

/**
 * receiveAnnotationFailure - action creator
 *
 * @param  {String} targetId
 * @param  {String} annotationId
 * @param  {String} error
 * @memberof ActionCreators
 */
export function receiveAnnotationFailure(targetId, annotationId, error) {
  return {
    annotationId,
    error,
    targetId,
    type: ActionTypes.RECEIVE_ANNOTATION_FAILURE,
  };
}

/**
 * coerceAnnotationToCanvasId - hack to force `on` attribute to canvas ID
 *
 * @param  {String} targetId
 * @param  {Object} annotationJson
 * TODO: also handle v3 target attribute
 */
function coerceAnnotationToCanvasId(targetId, annotationJson) {
  const coercedJson = Object.assign({}, annotationJson);

  coercedJson.resources = annotationJson.resources.map((resource) => {
    const coercedResource = Object.assign({}, resource);
    coercedResource.on = [].concat(coercedResource.on);
    if (coercedResource.on[0].includes('xywh=')) {
      coercedResource.on[0] = coercedResource.on[0].replace(/^[^#]+/, targetId); // replace up to hash
    }
    return coercedResource;
  });

  return coercedJson;
}

/**
 * filterAnnotationResources - filter annotation resources
 *
 * @param  {Object} annotationJson
 * TODO: make this into a configuration option
 */
function filterAnnotationResources(annotationJson) {
  const filteredJson = Object.assign({}, annotationJson);

  filteredJson.resources = annotationJson.resources.filter(resource => resource.dcType === 'Line');

  return filteredJson;
}

/**
 * fetchAnnotationResourcesFulltext - fetch annotation fulltext
 *
 * @param  {Object} annotationJson
 */
function fetchAnnotationResourcesFulltext(annotationJson) {
  const urls = annotationJson.resources
    .filter(resource => !resource.resource.chars && resource.resource['@id'])
    .map(resource => resource.resource['@id'].split('#')[0]);

  const fulltext = {};

  // TODO: error handling
  const fetches = uniq(urls).map(url => fetch(url)
    .then(response => response.json())
    .then((response) => {
      if (response.type === 'FullTextResource') fulltext[url] = response.value;
    }));

  return Promise.all(fetches).then(() => fulltext);
}

/**
 * filterAnnotationResources - dereference annotation resources
 *
 * @param  {Object} annotationJson
 */
function dereferenceAnnotationResources(annotationJson) {
  return fetchAnnotationResourcesFulltext(annotationJson)
    .then((fulltext) => {
      const dereferencedJson = Object.assign({}, annotationJson);

      dereferencedJson.resources = annotationJson.resources.map((resource) => {
        const dereferencedResource = Object.assign({}, resource);
        if (dereferencedResource.resource.chars || !dereferencedResource.resource['@id']) {
          return dereferencedResource;
        }

        const url = dereferencedResource.resource['@id'].split('#')[0];
        if (!fulltext[url]) return dereferencedResource;

        const fragment = dereferencedResource.resource['@id'].split('#')[1];

        dereferencedResource.resource.chars = fulltext[url];

        if (fragment) {
          const charMatch = fragment.match(/char=(\d+),(\d+)$/);
          if (charMatch) {
            dereferencedResource.resource.chars = dereferencedResource.resource.chars.slice(
              Number(charMatch[1]),
              Number(charMatch[2]) + 1,
            );
          }
        }

        return dereferencedResource;
      });

      return dereferencedJson;
    });
}

/**
 * fetchAnnotation - action creator
 *
 * @param  {String} annotationId
 * @memberof ActionCreators
 */
export function fetchAnnotation(targetId, annotationId) {
  return ((dispatch) => {
    dispatch(requestAnnotation(targetId, annotationId));

    return fetch(annotationId)
      .then(response => response.json())
      .then(json => filterAnnotationResources(json))
      .then(json => coerceAnnotationToCanvasId(targetId, json))
      .then(json => dereferenceAnnotationResources(json))
      .then(json => dispatch(receiveAnnotation(targetId, annotationId, json)))
      .catch(error => dispatch(receiveAnnotationFailure(targetId, annotationId, error)));
  });
}

/**
 * selectAnnotation - action creator
 *
 * @param  {String} windowId
 * @param  {String} targetId
 * @param  {String} annotationId
 * @memberof ActionCreators
 */
export function selectAnnotation(windowId, targetId, annotationId) {
  return {
    annotationId,
    targetId,
    type: ActionTypes.SELECT_ANNOTATION,
    windowId,
  };
}

/**
 * deselectAnnotation - action creator
 *
 * @param  {String} windowId
 * @param  {String} targetId
 * @param  {String} annotationId
 * @memberof ActionCreators
 */
export function deselectAnnotation(windowId, targetId, annotationId) {
  return {
    annotationId,
    targetId,
    type: ActionTypes.DESELECT_ANNOTATION,
    windowId,
  };
}

/**
 * toggleAnnotationDisplay - action creator
 *
 * @param  {String} windowId
 * @memberof ActionCreators
 */
export function toggleAnnotationDisplay(windowId) {
  return {
    type: ActionTypes.TOGGLE_ANNOTATION_DISPLAY, windowId,
  };
}

/**
 * toggleAnnotationDisplay - action creator
 *
 * @param  {String} windowId
 * @memberof ActionCreators
 */
export function highlightAnnotation(windowId, annotationId) {
  return {
    annotationId, type: ActionTypes.HIGHLIGHT_ANNOTATION, windowId,
  };
}
