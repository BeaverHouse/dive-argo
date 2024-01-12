---
sidebar-position: 5
---

# Other features

In Argo CD, you can also set other various options on making an application.

## Prune

When you enable this option, if resources are deleted in git resource, they'll also be deleted in K8s.  
Basically it is deactivated, and in this case the K8S resource will be maintained although the git resource get deleted.

## Self-heal

Enabling this option will ensure that the Kubernetes resource is always maintained in the form defined by git resource. In other words, if you directly modify the K8S resources outside of git, it will roll-back.  
You can only use this feature when the auto-sync feature is enabled.

## File filtering

In addition to specifying a path, you can also include specific files of resource in the application or exclude certain files.  
For more details, please refer to the following link.  
https://argo-cd.readthedocs.io/en/stable/user-guide/directory/#includingexcluding-files

<br/>

These options are the part of the overall options: you can ignore specific changes or change the sync policy, and so on.  
For more details, please refer to the [official Argo CD docs][argocd].

[argocd]: https://argo-cd.readthedocs.io/en/stable/
