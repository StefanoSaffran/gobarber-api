import truncate from '../util/truncate';
import { getToken } from '../getToken';
import uploadFile from '../uploadFile';

describe('File', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to upload a file', async () => {
    const token = await getToken();

    const body = await uploadFile(token);

    expect(body).toHaveProperty('path');
  });
});
