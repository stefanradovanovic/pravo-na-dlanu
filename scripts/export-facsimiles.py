"""Export PIS page sequences as lossless local facsimiles. Run after boundary review.

The candidate file is an audit artifact, not OCR to publish as legal text.
Dependencies: PyMuPDF. Source PDFs stay in the ignored cache.
"""
import argparse, hashlib, json, math, pathlib, sys
import pymupdf

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAX_BYTES = 40 * 1024 * 1024

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def export(candidates_path):
    candidates = json.loads(candidates_path.read_text(encoding='utf-8'))
    registry = json.loads((ROOT/'content/registry.json').read_text(encoding='utf-8'))
    records = {record['id']: record for record in registry['records']}
    output = ROOT/'public/pis'
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT/'content/facsimiles.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    sources = {}
    for index, (id, candidate) in enumerate(candidates.items(), 1):
        record = records[id]
        assert candidate['citation'] == record['citation']
        assert candidate['baseSourceSha256'] == record['sha256']
        assert candidate['start']['score'] >= 96 or candidate.get('titleReviewed')
        pages = candidate['sourcePages']
        assert pages and len(set(pages)) == len(pages)
        assert len(pages) == len(candidate['printedPages'])
        key = candidate['baseSourceSha256']
        source_path = ROOT/'.cache/pis-pdfs'/f'{key}.pdf'
        if key not in sources:
            meta = json.loads(source_path.with_suffix('.json').read_text(encoding='utf-8'))
            assert digest(source_path) == meta['sha256'], f'Changed cached source: {key}'
            sources[key] = meta
        meta = sources[key]
        source = pymupdf.open(source_path)
        assert all(0 <= page < len(source) for page in pages)
        parts = []
        def part(indices):
            result = pymupdf.open()
            for page in indices:
                result.insert_pdf(source, from_page=page, to_page=page, links=False, annots=False, widgets=False)
            data = result.tobytes(garbage=4, deflate=True, use_objstms=1, no_new_id=True)
            result.close()
            if len(data) > MAX_BYTES and len(indices) > 1:
                middle = len(indices)//2
                part(indices[:middle]); part(indices[middle:]); return
            assert len(data) <= MAX_BYTES, 'Single source page exceeds the asset budget'
            sha = hashlib.sha256(data).hexdigest()
            destination = output/f'{sha}.pdf'
            if not destination.exists(): destination.write_bytes(data)
            parts.append({'url': f'/pis/{sha}.pdf', 'sha256': sha, 'pages': len(indices)})
        for start in range(0, len(pages), 50): part(pages[start:start+50])
        source.close()
        manifest[id] = {
            'baseSourceSha256': key, 'citation': record['citation'],
            'facsimile': {
                'sourceUrl': meta['url'], 'sourceSha256': meta['sha256'],
                'fetchedAt': meta['fetchedAt'], 'version': record['citation'],
                'coverage': candidate.get('reviewNote','').strip() + ' Факсимил целог закона из наведене објаве, са прилозима. На граничним страницама могу остати делови суседних аката. Ово је изворно издање, а не нови пречишћени текст.',
                'pageLabels': [f'Страна гласила {page}' for page in candidate['printedPages']], 'parts': parts,
            },
            'evidence': {
                'sourcePages': pages,
                'startTitle': candidate['start']['title'],
                'closingProvision': candidate['end']['text'],
                'method': candidate['method'],
            },
        }
        if index % 50 == 0: print(f'Exported {index}/{len(candidates)} laws', flush=True)
    temporary = manifest_path.with_suffix('.tmp')
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    temporary.replace(manifest_path)
    print(f'Exported {len(candidates)} complete law facsimiles', flush=True)

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('--candidates', type=pathlib.Path, default=ROOT/'.cache/scan-candidates.json')
    args = parser.parse_args()
    export(args.candidates)
