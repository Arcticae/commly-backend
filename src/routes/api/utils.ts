/* eslint-disable import/prefer-default-export */
import { Response } from 'express';

export const apiCollection = (res: Response, collection: any[]) => {
  if (collection.length) {
    return res.status(200).send(collection);
  }
  return res.status(204).send([]);
};
