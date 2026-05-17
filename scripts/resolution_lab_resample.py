# Uses Slicer to resample a source volume into a list of resolutions

# Requirements:
# Python 3
# Must have https://www.slicer.org/ installed, this script can only be run through slicer itself

# Example Usage:
# ./Slicer.exe --no-main-window --no-splash --testing --python-script "resolution_lab_resample.py"
# /Applications/Slicer.app/Contents/MacOS/Slicer --no-main-window --no-splash --testing --python-script "resolution_lab_resample.py"

###

# How To Use:
## 1. If you only have a DICOM set, you must convert the DICOM to something like NIFTI (.nii file)
#### Docs on dicom loading: https://slicer.readthedocs.io/en/latest/user_guide/modules/dicom.html
#### Docs on general/saving loading: https://slicer.readthedocs.io/en/latest/user_guide/data_loading_and_saving.html
## 2. Change line 21 to point to your source file (should be high resolution
## 3. Change array starting on line 22 to the resolutions you want to output

# Can't be DICOM, must be some sort of single-file format
sourceVolumePath = 'C:/Users/MarkM/Downloads/0.6 Source.nii'
targetResolutions = [
    [0.4, 0.4, 0.4],
    [0.5, 0.5, 0.5],
    [0.6, 0.6, 0.6],
    [0.7, 0.7, 0.7],
    [0.8, 0.8, 0.8],
    [0.9, 0.9, 0.9],
    [1.0, 1.0, 1.0],
    [1.1, 1.1, 1.1],
    [1.2, 1.2, 1.2],
    [1.3, 1.3, 1.3],
    [1.4, 1.4, 1.4],
    [1.5, 1.5, 1.5],
    [3.0, 3.0, 3.0],
]

rsv = slicer.modules.resamplescalarvolume
sourceVolume = slicer.util.loadVolume(sourceVolumePath)

for resolution in targetResolutions:
    newVolume = slicer.vtkMRMLScalarVolumeNode()
    baseFileName = 'HD_%.1f_%.1f_%.1f_' % (resolution[0], resolution[1], resolution[2])
    baseFileName = baseFileName.replace('.', '-')
    newVolume.SetName(baseFileName)
    slicer.mrmlScene.AddNode(newVolume)

    parameters = {}
    parameters['outputPixelSpacing'] = '%.1f,%.1f,%.1f' % (resolution[0], resolution[1], resolution[2])
    parameters['interpolationType'] = 'bspline'
    parameters['InputVolume'] = sourceVolume.GetID()
    parameters['OutputVolume'] = newVolume.GetID()
    slicer.cli.run(rsv, None, parameters, True)
    slicer.util.saveNode(newVolume, 'C:/tmp/slicer/%s.nii' % baseFileName)

sys.exit(0)
