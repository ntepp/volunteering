import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImageUploadService, MAX_IMAGE_SIZE_BYTES } from './image-upload.service';
import { environment } from '../../../environments/environment';

describe('ImageUploadService', () => {
  let service: ImageUploadService;
  let httpMock: HttpTestingController;
  const uploadUrl = `${environment.apiUrl}/api/v1/images`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ImageUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('validate', () => {
    it('should accept a valid image file', () => {
      const file = new File([new Uint8Array(10)], 'photo.png', { type: 'image/png' });
      expect(service.validate(file)).toBeNull();
    });

    it('should reject an unsupported content type', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      expect(service.validate(file)).toContain('Format non supporté');
    });

    it('should reject a file that is too large', () => {
      const bigFile = { type: 'image/png', size: MAX_IMAGE_SIZE_BYTES + 1 } as File;
      expect(service.validate(bigFile)).toContain('5 Mo');
    });
  });

  describe('upload', () => {
    it('should POST the file as multipart form data and return id + url', () => {
      const file = new File([new Uint8Array(4)], 'photo.png', { type: 'image/png' });
      let response: any;

      service.upload(file).subscribe(r => response = r);

      const req = httpMock.expectOne(uploadUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      req.flush({ id: 'abc123', url: `${uploadUrl}/abc123` });

      expect(response.id).toBe('abc123');
      expect(response.url).toContain('/api/v1/images/abc123');
    });

    it('should map a 400 error to a friendly message', () => {
      const file = new File([new Uint8Array(4)], 'photo.png', { type: 'image/png' });
      let error: Error | undefined;

      service.upload(file).subscribe({ error: e => error = e });

      httpMock.expectOne(uploadUrl).flush({}, { status: 400, statusText: 'Bad Request' });
      expect(error?.message).toContain('Image invalide');
    });
  });
});
